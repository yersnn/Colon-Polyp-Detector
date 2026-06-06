# ColoRISK — User Guide

[🇷🇺 Руководство на русском](USER_GUIDE.ru.md)

---

## What is ColoRISK?

**ColoRISK** is an AI-powered tool that automatically detects colon polyps in colonoscopy images and videos. You upload a file — the system analyses it using a deep learning model, highlights any detected polyps, and gives you a confidence score.

It is designed to assist medical professionals during diagnostic review. Results are stored in your personal account so you can access your analysis history at any time.

> ⚠️ **Important**: ColoRISK is an assistive tool and does not replace clinical diagnosis. All findings must be reviewed by a qualified medical professional.

---

## Getting Started

### 1. Open the app

Navigate to the ColoRISK web application in your browser.

### 2. Create an account

If you are a new user:

1. Click **"Create one"** on the login page
2. Enter your **email address**
3. Enter a **password** (minimum 6 characters)
4. Confirm your password
5. Click **"Create account"**

You will be automatically signed in after registration.

### 3. Sign in

If you already have an account:

1. Enter your **email address**
2. Enter your **password**
3. Click **"Sign in"**

---

## Uploading a File for Analysis

Once signed in, you will see the **Dashboard** — the main page of the app.

### How to upload

You can upload a file in two ways:

- **Drag and drop** — drag a file from your computer directly onto the upload area
- **Click to browse** — click the upload area to open a file picker

### Supported formats

| Format | Type | Examples |
|--------|------|---------|
| JPG / JPEG | Image | Colonoscopy photo |
| PNG | Image | Colonoscopy photo |
| BMP, TIFF, WebP | Image | Other image formats |
| MP4, MOV | Video | Colonoscopy recording |
| AVI, MKV, WebM | Video | Other video formats |
| ODT | Document | OpenDocument Text with embedded images |

**Maximum file size: 500 MB**

### What happens after upload

1. The file appears in your **Analysis History** with the status **"Pending"**
2. The system begins processing — status changes to **"Processing"**
3. Once complete, the status changes to **"Done"**
4. If something goes wrong, the status shows **"Failed"** with an error description

Processing time depends on file size and type:
- Images: typically a few seconds
- Videos: may take several minutes depending on length

---

## Viewing Results

Click **"View Results"** on any completed analysis card to open the results page.

### AI Output vs. Original

At the top of the results page you will see a toggle:

- **AI Output** — the file with detected polyps highlighted in green-teal overlay
- **Original** — the unmodified uploaded file

Use this toggle to compare what the model detected against the original image or video.

### Detection panel

On the right side you will see:

| Field | Description |
|-------|-------------|
| **Polyps detected** | Number of polyp regions found |
| **Avg confidence** | How confident the model was (e.g. `87.5%` = high confidence) |
| **Processing time** | How long the analysis took in seconds |
| **Media type** | Image, Video, or Document |

**What confidence means:**
- **70–100%** — High confidence, strong detection signal
- **50–70%** — Moderate confidence, worth reviewing carefully
- **0–49%** — Low confidence, the model is uncertain

A confidence of **0%** with **0 polyps detected** means no polyps were found in the file.

---

## Downloading the Annotated Result

On the results page, click the **"Download processed"** button (below the detection panel) to save the AI-annotated file to your computer.

The downloaded file will contain the original image or video with polyp regions highlighted.

---

## Analysis History

Your **Dashboard** displays all previous analyses as cards. Each card shows:

- File name
- Thumbnail or status indicator
- Number of detections
- Confidence score
- Date and time of upload

You can click **"View Results"** on any card to revisit the full results at any time.

To **delete** an analysis, click the trash icon on the card. This permanently removes the analysis and both the original and processed files.

---

## Language & Theme

### Changing the language

In the top-right corner of the page, you will see three language buttons:

- **EN** — English
- **RU** — Русский (Russian)
- **KZ** — Қазақша (Kazakh)

Click any button to switch the interface language. Your choice is saved automatically.

### Switching between dark and light mode

Next to the language buttons there is a ☀️ / 🌙 icon button. Click it to toggle between **dark mode** (black background) and **light mode** (white background). Your preference is saved automatically.

---

## Troubleshooting

### "Login failed"
- Double-check your email address and password
- Make sure Caps Lock is not on
- If you forgot your password, you will need to create a new account

### "Processing failed"
- The file may be corrupted or in an unsupported format
- Try re-exporting or re-saving the file and uploading again
- Very large files (close to 500 MB) may occasionally fail — try a smaller clip

### "Unsupported file type"
- Check that your file uses one of the supported formats listed above
- Rename the file extension if it was saved with a non-standard one (e.g. `.jpeg` instead of `.jpg` is fine, both are supported)

### The page shows a loading spinner indefinitely
- The backend server may be starting up (first request after inactivity can take ~30 seconds)
- Refresh the page and try again
- If the problem persists, check your internet connection

### File uploaded but still shows "Processing" after a long time
- Video files can take several minutes
- If status has not changed for more than 10 minutes, try deleting and re-uploading the file

---

## Privacy & Data

- All uploaded files are stored privately and associated only with your account
- Other users cannot see or access your analyses
- You can permanently delete any analysis (and its files) at any time from the Dashboard
- Filenames are stored using randomised identifiers — direct file URLs cannot be guessed by third parties

---

*ColoRISK — Assistive AI for early colorectal cancer detection*
