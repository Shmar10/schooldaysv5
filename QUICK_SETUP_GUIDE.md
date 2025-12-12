# Quick Setup with AI Assistance - User Guide

## Overview

The Quick Setup feature allows you to create your entire school calendar using AI assistance. Simply upload images of your school's schedule and calendar, get an AI-generated prompt, and paste the AI's response to automatically populate your calendar.

## How It Works

1. **Enter School Information** - Basic details about your school
2. **Upload Images** - Upload your bell schedule and school calendar images
3. **Get AI Prompt** - Copy a detailed prompt to use with ChatGPT/Claude
4. **Paste AI Code** - Paste the JSON the AI generates to auto-populate everything

## Step-by-Step Instructions

### Step 1: School Information

Fill in:
- **School Name** (required) - e.g., "Lincoln High School"
- **School Colors** (optional) - e.g., "Blue and Gold"
- **Mascot** (optional) - e.g., "Eagles"
- **Start Date** (required) - First day of school
- **End Date** (required) - Last day of school
- **Time Zone** (required) - e.g., "America/New_York"

Click "Next: Upload Images"

### Step 2: Upload Images

Upload images of:
- **Bell Schedule** (recommended) - A clear image showing your daily schedule with period times
- **School Calendar** (recommended) - An image showing holidays, breaks, and important dates

**Tips for best results:**
- Use clear, high-quality images
- Make sure text is readable
- Include the full schedule/calendar if possible

Click "Generate AI Prompt"

### Step 3: Get AI Prompt

A detailed prompt will be generated. This prompt:
- Includes all your school information
- Instructs the AI on what to extract
- Specifies the exact JSON format needed

**What to do:**
1. Click "Copy Prompt" to copy the entire prompt
2. Go to ChatGPT (chat.openai.com) or Claude (claude.ai)
3. Paste the prompt
4. Attach your schedule and calendar images
5. Wait for the AI to analyze and generate JSON

### Step 4: Paste AI Code

1. Copy the JSON code that the AI generated
2. Paste it into the text area
3. Click "Create Calendar"

The system will automatically:
- Create your school year
- Add all bell schedules
- Add all breaks and holidays
- Add special days and events
- Set up everything ready to use!

## Example AI Prompt

The generated prompt will look something like this:

```
You are helping to set up a school year calendar system. Please analyze the provided images and information, then generate a JSON configuration...

SCHOOL INFORMATION:
- School Name: Lincoln High School
- School Colors: Blue and Gold
- Mascot: Eagles
- School Year: 2025-08-12 to 2026-05-21
...

[Detailed instructions for extracting schedules, dates, breaks, etc.]
```

## Expected JSON Format

The AI should return JSON in this format:

```json
{
  "schedules": [
    {
      "name": "Default Schedule",
      "isDefault": true,
      "periods": [
        {
          "name": "Period 1",
          "startTime": "08:00",
          "endTime": "08:45"
        }
      ]
    }
  ],
  "breaks": [
    {
      "startDate": "2025-11-22",
      "endDate": "2025-11-28",
      "label": "Thanksgiving Break"
    }
  ],
  "specialDays": [
    {
      "date": "2025-12-17",
      "dayType": "SPECIAL_SCHEDULE",
      "label": "Final Exams Day 1"
    }
  ],
  "nonAttendanceDays": [
    {
      "date": "2025-09-01",
      "label": "Labor Day"
    }
  ]
}
```

## Troubleshooting

### The AI didn't return valid JSON
- Make sure you copied the entire JSON response
- Remove any markdown formatting (```json and ```)
- Check that all brackets and braces are balanced

### Some dates are missing
- The AI might have missed some dates in the images
- You can manually add them later in the Settings page
- Try re-uploading clearer images

### Schedules aren't correct
- Verify the times in your uploaded schedule image are clear
- You can edit schedules after creation in Settings → Schedules

### Error creating calendar
- Check that all dates are within your school year range
- Ensure date format is YYYY-MM-DD
- Ensure time format is HH:MM (24-hour)

## After Quick Setup

Once your calendar is created:
- Review the Dashboard to see your calendar summary
- Check the Calendar view to see all dates
- Go to Settings to make any adjustments
- Add additional schedules or special days as needed

## Manual Setup Alternative

If you prefer to set up manually or the AI setup doesn't work for you:
- Go to Settings → School Year tab
- Create your school year manually
- Add schedules, breaks, and special days one by one

## Tips for Best Results

1. **Clear Images**: Use high-resolution images with clear text
2. **Complete Information**: Include all schedules (regular, late start, exam schedules)
3. **All Dates**: Make sure your calendar image shows all holidays and breaks
4. **Review AI Output**: Always review what the AI extracted before pasting
5. **Make Adjustments**: You can always edit things after creation

## Support

If you encounter issues:
1. Check the error message for specific problems
2. Verify your JSON format is correct
3. Try the manual setup method as an alternative
4. Review the generated prompt to ensure it's complete

Happy calendar building! 🎓

