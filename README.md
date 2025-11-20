# Cassava Doctor 🌿🔍

![Project Status](https://img.shields.io/badge/Status-Live-success)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_TensorFlow.js_|_Azure-blue)
![License](https://img.shields.io/badge/License-MIT-green)

**Cassava Doctor** is an AI-powered Progressive Web Application (PWA) designed to empower farmers, agricultural extension workers, and researchers in Nigeria and beyond. By leveraging on-device machine learning, the app provides rapid, offline-capable, and multilingual diagnosis of cassava leaf diseases directly in the browser.

---

## 📋 Table of Contents
- [Project Overview](#-project-overview)
- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [Key Features](#-key-features)
- [Dataset & Model](#-dataset--model)
- [Supported Diseases](#-supported-diseases)
- [Tech Stack](#-tech-stack)
- [Installation & Local Development](#-installation--local-development)
- [How It Was Built](#-how-it-was-built)
- [Live Demo](#-live-demo)

---

## 🚀 Project Overview

Cassava is a staple crop for millions of people in Africa, serving as a major source of carbohydrates. However, yields are constantly threatened by viral and bacterial diseases that can destroy entire harvests if not detected early.

**Cassava Doctor** bridges the gap between advanced agricultural science and the rural farmer. Unlike traditional cloud-based AI solutions that require strong internet connections and upload latency, Cassava Doctor runs its AI model **entirely on the client-side**.

---

## 🚩 The Problem

1.  **Delayed Diagnosis:** Farmers often struggle to identify specific diseases until it is too late to save the crop.
2.  **Internet Connectivity:** Many farms are located in rural areas with poor or non-existent internet access, making cloud-based API solutions unreliable.
3.  **Language Barrier:** Most agricultural advice is available only in English, excluding farmers who speak local dialects.

---

## 💡 The Solution

We built a lightweight, browser-based diagnostic tool that:
1.  Uses **Computer Vision** to identify diseases instantly.
2.  Runs **Offline** after the initial load (using TensorFlow.js).
3.  Provides actionable management advice in **English, Yoruba, Hausa, and Igbo**.

---

## ✨ Key Features

*   **Real-time Inference:** Utilizes the device camera to analyze leaves in real-time.
*   **Image Upload:** Support for analyzing existing photos from the gallery.
*   **Privacy-First:** No images are sent to a server. All processing happens locally on the user's device using WebGL acceleration.
*   **Multilingual Support:** 
    *   🇬🇧 English
    *   🇳🇬 Yoruba
    *   🇳🇬 Hausa
    *   🇳🇬 Igbo
*   **Detailed Analysis:** Displays confidence scores for all potential classes, not just the top result.

---

## 📊 Dataset & Model

### The Dataset
The model was trained using the **Cassava Leaf Disease Classification** dataset by *Nirmal Sankalana* hosted on Kaggle.
*   **Source:** [Kaggle Dataset Link](https://www.kaggle.com/datasets/nirmalsankalana/cassavaleaf-disease-classification)
*   **Composition:** The dataset consists of thousands of labeled images representing healthy leaves and various disease states, providing a robust foundation for the model to learn texture and color patterns.

### The Model Architecture
*   **Training Engine:** Google Teachable Machine.
*   **Base Model:** MobileNet (optimized for mobile devices and web browsers).
*   **Export Format:** TensorFlow.js Layers Model (`model.json` + `weights.bin`).
*   **Preprocessing:** Images are resized to `224x224` pixels and normalized to a float range of `[-1, 1]` before being fed into the tensors.

---

## 🦠 Supported Diseases

The app is trained to classify the following 5 specific categories:

1.  **Cassava Healthy:**
    *   *Visuals:* Deep green leaves, fully open, free from spots or curling.
    *   *Status:* No action needed; routine maintenance.

2.  **Cassava Mosaic Disease (CMD):**
    *   *Visuals:* Patches of yellow and green mixing (mosaic pattern), twisted/curled leaves, stunted growth.
    *   *Severity:* High. Most common disease.

3.  **Cassava Bacterial Blight (CBB):**
    *   *Visuals:* Angular water-soaked spots turning brown, leaves appearing "scorched" by fire, wilting.
    *   *Severity:* High. Can lead to total plant death.

4.  **Cassava Green Mottle (CGM):**
    *   *Visuals:* Faint to distinct green mottle patterns, but leaves are usually *not* stunted or twisted.
    *   *Severity:* Moderate.

5.  **Cassava Brown Streak Disease (CBSD):**
    *   *Visuals:* Subtle yellowing along veins. Often called the "silent killer" because it destroys the root (tuber) with dry rot while the leaves look mostly okay.
    *   *Severity:* Critical. Destroys the edible part of the crop.

---

## 🛠 Tech Stack

*   **Frontend Framework:** React 18 (Functional Components + Hooks)
*   **Language:** TypeScript (for type safety and robust code)
*   **Build Tool:** Vite (for lightning-fast development and optimized builds)
*   **Machine Learning:** TensorFlow.js (`@tensorflow/tfjs`)
*   **Styling:** Tailwind CSS (Mobile-first, Dark Mode UI)
*   **Hosting/CI/CD:** Microsoft Azure Static Web Apps (Automated deployment via GitHub Actions)
*   **Icons:** Lucide React

---

## 💻 Installation & Local Development

To run this project locally for testing or development:

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/cassava-doctor.git
    cd cassava-doctor
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Verify Model Files:**
    Ensure the following files are present in your `public/` directory:
    *   `model.json`
    *   `weights.bin`
    *   `tm_metadata.json`

4.  **Start Development Server:**
    ```bash
    npm run dev
    ```

5.  **Open in Browser:**
    Navigate to `http://localhost:5173` (or the port displayed in your terminal).

---

## 🏗 How It Was Built

1.  **Model Training:** We uploaded the Kaggle dataset to Google Teachable Machine, balanced the classes, and trained the model until accuracy stabilized. We then exported it specifically for the web (TensorFlow.js).
2.  **Frontend Architecture:** We built a React application with a custom hook to handle the camera stream. We integrated `tf.loadLayersModel` to load the AI asynchronously.
3.  **Tensor Processing:** The app converts the HTML Video or Image element into a Tensor, resizes it to 224x224, normalizes the pixel data, and runs `model.predict()`.
4.  **Localization Engine:** A dictionary system was built to map disease IDs to translation objects containing diagnosis and management advice in local languages.
5.  **Deployment:** The app was deployed to **Azure Static Web Apps**. We configured a custom workflow file to handle the build process, ensuring the static assets (model weights) were served correctly from the public distribution folder.

---

## 🔗 Live Demo & Resources

*   **Live Application:** https://mango-plant-09edc4610.3.azurestaticapps.net/
*   **Video Demonstration:** [INSERT_VIDEO_LINK_HERE]
*   **Dataset:** https://www.kaggle.com/datasets/nirmalsankalana/cassava-leaf-disease-classification
---

*Built with 💚 for the Hackathon.*
