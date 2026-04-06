# RoadRescue PWA Icons

This directory should contain the following icon files for proper PWA functionality:

## Required Icons:
- icon-72x72.png
- icon-96x96.png  
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png
- emergency-96x96.png (for shortcuts)
- badge-72x72.png (for notifications)

## Temporary Solution:
For now, the PWA will work without icons, but the install prompt may not show optimally.
To create proper icons:

1. Use your logo/design
2. Generate multiple sizes using tools like:
   - https://realfavicongenerator.net/
   - https://www.pwabuilder.com/imageGenerator
3. Place them in this directory

## Current Status:
✅ PWA manifest created
✅ Service worker registered  
✅ Install prompt logic ready
⚠️ Icons needed for optimal experience

The install prompt should now appear after 5 seconds on eligible browsers,
even without perfect icons.
