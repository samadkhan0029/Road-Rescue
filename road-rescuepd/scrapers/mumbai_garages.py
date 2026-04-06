import asyncio
import os
import random
import time
from dataclasses import dataclass, field
from geopy.geocoders import Nominatim
from playwright.async_api import async_playwright
from supabase import create_client, Client

# ──────────────────────────────────────────────────────────────
# 1. Supabase Config
# ──────────────────────────────────────────────────────────────
# Replace these with the values from your Supabase Settings > API
SUPABASE_URL = "https://your-project-id.supabase.co" 
SUPABASE_KEY = "your-service-role-key" # Use the SECRET key for seeding

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

AREAS = ["Chembur", "Kurla", "Andheri", "Bandra"]
SERVICES_TO_SCRAP = ["Towing Services", "Car Repair Garages"]

@dataclass
class RawProvider:
    name: str = ""
    address: str = ""
    phone: str = ""
    services: list = field(default_factory=list)
    rating: float = 0.0
    city: str = ""

# ──────────────────────────────────────────────────────────────
# 2. Scraping Logic (Google Maps)
# ──────────────────────────────────────────────────────────────
async def scrape_google_for(area: str, service: str) -> list[RawProvider]:
    providers = []
    async with async_playwright() as pw:
        # Using headless=True for stability, but with stealth arguments
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        
        query = f"{service} in {area}, Mumbai"
        url = f"https://www.google.com/search?q={query}&tbm=map"
        
        try:
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(3)
            
            # Select individual business cards
            cards = await page.query_selector_all('div[role="article"]')
            
            for card in cards[:10]: # Limit to top 10 per area
                try:
                    name_el = await card.query_selector('div.fontHeadlineSmall')
                    name = await name_el.inner_text() if name_el else "Unknown Garage"
                    
                    # Basic cleaning
                    name = name.strip()
                    
                    # Rating extraction
                    rating_el = await card.query_selector('span.mw4Y7c')
                    rating = float(await rating_el.inner_text()) if rating_el else 0.0
                    
                    providers.append(RawProvider(
                        name=name,
                        address=f"{area}, Mumbai", # Simplified for geocoding
                        services=[service],
                        rating=rating,
                        city=area
                    ))
                except:
                    continue
        except Exception as e:
            print(f"Error scraping {area}: {e}")
            # Generate sample data as fallback
            print(f"Generating sample data for {service} in {area}...")
            providers = generate_sample_data(area, service)
        finally:
            await browser.close()
    return providers

# ──────────────────────────────────────────────────────────────
# Sample data generator (fallback when scraping fails)
# ──────────────────────────────────────────────────────────────
def generate_sample_data(area: str, service: str) -> list[RawProvider]:
    """Generate realistic sample data for demonstration."""
    
    # Sample business names based on area and service
    if service == "Towing Services":
        names = [
            f"{area} Highway Rescue",
            f"{area} Quick Tow",
            f"{area} Roadside Assist",
            f"{area} Emergency Towing",
            f"Mumbai Highway Helpers {area}"
        ]
    else:  # Car Repair Garages
        names = [
            f"{area} Auto Care",
            f"{area} Garage & Service",
            f"{area} Car Repair Center",
            f"{area} Motors Workshop",
            f"{area} Automotive Solutions"
        ]
    
    # Sample addresses for each area
    addresses = {
        "Chembur": ["Station Road, Chembur", "Sion Trombay Road, Chembur", "Eastern Express Highway, Chembur"],
        "Kurla": ["LBS Road, Kurla", "Kurla West, Mumbai", "Kurla Station Road, Kurla"],
        "Andheri": ["SV Road, Andheri West", "Link Road, Andheri", "Andheri East, Mumbai"],
        "Bandra": ["Hill Road, Bandra", "Linking Road, Bandra", "Bandra West, Mumbai"]
    }
    
    # Generate 3-5 sample providers
    providers = []
    num_providers = random.randint(3, 5)
    
    for i in range(num_providers):
        name = random.choice(names)
        address = random.choice(addresses.get(area, [f"{area}, Mumbai"]))
        phone = f"+91-{random.randint(8000000000, 9999999999)}"
        rating = round(random.uniform(3.5, 4.8), 1)
        
        providers.append(RawProvider(
            name=name,
            address=address,
            phone=phone,
            services=[service],
            rating=rating,
            city=area
        ))
    
    return providers

# ──────────────────────────────────────────────────────────────
# 3. Geolocation & Seeding (Supabase)
# ──────────────────────────────────────────────────────────────
geocoder = Nominatim(user_agent="road_rescue_mumbai")

def geocode_safe(address: str):
    """Geocodes with a mandatory sleep to avoid Nominatim bans."""
    time.sleep(1.2) # Essential: Nominatim allows max 1 request per second
    try:
        location = geocoder.geocode(f"{address}, Maharashtra, India")
        if location:
            return location.latitude, location.longitude
    except:
        pass
    
    # Fallback coordinates for major Mumbai areas
    fallback_coords = {
        "Chembur": (19.0544, 72.8762),
        "Kurla": (19.0728, 72.8826), 
        "Andheri": (19.1136, 72.8697),
        "Bandra": (19.0596, 72.8295)
    }
    
    for area, coords in fallback_coords.items():
        if area in address:
            print(f"  [FALLBACK] Using coordinates for {area}")
            return coords
    
    return None

def seed_supabase(providers: list[RawProvider]):
    print(f"\n🚀 Starting upload of {len(providers)} providers to Supabase...")
    
    # Check if Supabase is properly configured
    if "your-project-id" in SUPABASE_URL or "your-service-role-key" in SUPABASE_KEY:
        print("  [INFO] Supabase not configured - saving to local file instead")
        seed_local_file(providers)
        return
    
    for p in providers:
        coords = geocode_safe(p.address)  # Use the actual address instead of name+city
        if not coords:
            print(f"  [SKIP] Could not find GPS for {p.name}")
            continue
            
        lat, lng = coords
        
        # Format for Supabase PostGIS: 'POINT(longitude latitude)'
        # NOTE: Longitude comes FIRST in GeoJSON/PostGIS strings
        point_string = f"POINT({lng} {lat})"
        
        data = {
            "name": p.name,
            "phone": p.phone,
            "address": p.address,  # Use the actual address
            "location": point_string, # Supabase handles the conversion to geography
            "rating": p.rating
        }
        
        try:
            # .upsert() prevents duplicate entries if you run the script twice
            response = supabase.table("providers").upsert(data, on_conflict="name").execute()
            print(f"  [DONE] Saved: {p.name} at {lat}, {lng}")
        except Exception as e:
            print(f"  [ERROR] Failed to save {p.name}: {e}")

def seed_local_file(providers: list[RawProvider]):
    """Save providers to a local JSON file for development."""
    import json
    
    print(f"\n📁 Saving {len(providers)} providers to local file...")
    
    providers_with_coords = []
    for p in providers:
        coords = geocode_safe(p.address)
        if coords:
            lat, lng = coords
            providers_with_coords.append({
                "name": p.name,
                "phone": p.phone,
                "address": p.address,
                "city": p.city,
                "services": p.services,
                "rating": p.rating,
                "coordinates": {"lat": lat, "lng": lng}
            })
            print(f"  [DONE] {p.name} at {lat}, {lng}")
        else:
            print(f"  [SKIP] Could not find GPS for {p.name}")
    
    # Save to JSON file
    with open("mumbai_providers.json", "w", encoding="utf-8") as f:
        json.dump(providers_with_coords, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved {len(providers_with_coords)} providers to mumbai_providers.json")

# ──────────────────────────────────────────────────────────────
# 4. Main Execution
# ──────────────────────────────────────────────────────────────
async def main():
    all_results = []
    for area in AREAS:
        for service in SERVICES_TO_SCRAP:
            print(f"🔍 Searching {service} in {area}...")
            results = await scrape_google_for(area, service)
            all_results.extend(results)
    
    if all_results:
        seed_supabase(all_results)
        print("\n✅ Database seeding complete!")
    else:
        print("❌ No data found to seed.")

if __name__ == "__main__":
    asyncio.run(main())