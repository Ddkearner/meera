# Meera AI - Conversational Voice Assistant

Meera is a friendly, intelligent, and conversational AI voice assistant. This application showcases Meera's ability to engage in natural, voice-driven conversations with synchronized text and speech output, creating a seamless and realistic user experience.

This project was built to demonstrate the capabilities of modern AI and web technologies, serving as a template for creating sophisticated voice-first applications.

## ✨ Core Features

*   **Voice-First Interaction:** Speak directly to Meera to ask questions and get responses, with support for continuous speech recognition.
*   **Real-time Experience:** Meera thinks (shows a loading animation), then speaks and types its response at the same time, creating a natural, lifelike interaction.
*   **Text-to-Speech (TTS):** Responses are converted to audible speech and played back to the user.
*   **Typewriter Animation:** Meera's responses are displayed character-by-character, synchronized with the audio playback.
*   **Persistent Chat History:** Your conversation with Meera is automatically saved in your browser's local storage.
*   **Modern, Responsive UI:** The user interface is clean, modern, and works beautifully on both desktop and mobile devices.

## 🛠️ Tech Stack

This project is built with a modern, production-ready tech stack:

*   **Framework:** [Next.js](https://nextjs.org/) (with App Router)
*   **AI & Generative Backend:** [Google's Genkit](https://firebase.google.com/docs/genkit)
*   **Language Model (LLM):** [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/flash/)
*   **Text-to-Speech Model:** Google Gemini TTS
*   **UI Components:** [ShadCN UI](https://ui.shadcn.com/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useRef`)
*   **Speech Recognition:** Browser's native `SpeechRecognition` API

## 📂 Project Structure

Here's a brief overview of the key files and directories in the project:

```
/
├── app/                  # Next.js App Router pages (main chat UI)
│   └── chat/page.tsx     # The main component for the chat interface.
├── src/
│   ├── ai/               # Genkit AI flows and configuration.
│   │   ├── flows/
│   │   │   ├── chat.ts   # The main Genkit flow for handling chat logic.
│   │   │   └── tts.ts    # The Genkit flow for text-to-speech.
│   │   └── genkit.ts     # Genkit plugin and model configuration.
│   ├── components/       # Reusable React components.
│   │   ├── ui/           # ShadCN UI components.
│   │   ├── chat-header.tsx
│   │   ├── chat-input.tsx
│   │   └── chat-messages.tsx
│   ├── hooks/            # Custom React hooks for specific functionality.
│   │   ├── use-speech-recognition.ts
│   │   └── use-typewriter.ts
│   └── lib/              # Utility functions, types, and server actions.
│       ├── actions.ts    # Next.js server actions to call Genkit flows.
│       └── types.ts      # TypeScript type definitions.
├── public/               # Static assets (currently none).
├── package.json          # Project dependencies and scripts.
└── next.config.ts        # Next.js configuration.
```

## 🚀 Getting Started

Follow these instructions to set up and run the project on your local machine using PowerShell.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later is recommended)
*   npm (comes with Node.js)
*   A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Setup Instructions

You'll need **two PowerShell terminals** running at the same time for the project to work completely: one for the website's user interface (Next.js) and one for the AI backend (Genkit).

#### **Step 1: Set Up Your API Key**

The AI assistant, Meera, uses the Gemini API. You'll need to provide an API key for it to work.

1.  In the root of your project, create a new file named `.env`.
2.  Open the `.env` file and add the following line, replacing `YOUR_API_KEY_HERE` with your actual Gemini API key:

    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

#### **Step 2: Install Project Dependencies**

Before running the project, you need to install all the necessary packages listed in `package.json`.

1.  Open your first PowerShell terminal.
2.  Navigate to your project's root directory.
3.  Run the following command:

    ```powershell
    npm install
    ```

#### **Step 3: Run the AI Backend (Genkit)**

This server handles the AI logic, like processing chat messages and generating speech.

1.  Open a **new, second** PowerShell terminal.
2.  Navigate to your project's root directory.
3.  Run this command to start the Genkit development server:

    ```powershell
    npm run genkit:watch
    ```

    You should see a message indicating that the Genkit server is running and watching for changes. Keep this terminal open.

#### **Step 4: Run the Website (Next.js)**

This server runs the chat interface that you see and interact with in the browser.

1.  Go back to your **first** PowerShell terminal (where you ran `npm install`).
2.  Run this command to start the Next.js development server:

    ```powershell
    npm run dev
    ```

3.  After a few moments, it will show you a URL, usually `http://localhost:9002`. Open this URL in your web browser to see and use the Meera AI chat application.

### Usage

1.  When you open the app, it will ask for microphone permission. Click **"Allow"**.
2.  The microphone icon will glow, indicating Meera is listening.
3.  Start speaking to ask a question. As you speak, your words will appear in the text box.
4.  Once you stop speaking, your message is sent automatically.
5.  You can also type a message and press Enter or click the send button.
6.  Meera will show a loading animation while it thinks, and then will begin speaking and typing its response at the same time.

---

Feel free to explore the code to see how it works and customize it to your needs!
