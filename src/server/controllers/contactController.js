export const submitContact = async (req, res, next) => {
  try {
    const { firstName, lastName, email, subject, message } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please fill in all required fields' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please provide a valid email address' 
      });
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send email notification
    // 3. Send auto-reply to customer
    
    // For now, just log and return success
    console.log('Contact form submission:', {
      firstName,
      lastName,
      email,
      subject,
      message,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({ 
      success: true, 
      message: 'Contact form submitted successfully' 
    });

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to submit contact form. Please try again.' 
    });
  }
};
