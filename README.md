# DevChat
> This is a simple chat application that I made


## Quick Note
This is something I made at the beginning of 2025 and then completely forgot about however I have now made the code public for others to use however I do plan on updating this eventually as it is a fully functioning application that is just missing a lot of features.

## Introduction
A lightweight, modern chat application built with TypeScript, Vite, Tailwind CSS, and a clean client/server architecture. Originally created on Replit as a learning project, DevChat has grown into a flexible foundation for real‑time messaging features, user accounts, and more.

This repository is structured for clarity, scalability, and ease of development — making it a great starting point for future enhancements.

## ✨ Features
Modern tech stack using TypeScript across the entire project

- **Client / Server / Shared** architecture for clean separation of concerns

- **Tailwind CSS** for rapid UI development

- **Drizzle ORM** for type‑safe database access

- **Vite** for fast development and bundling

Designed to run smoothly on Replit or any Node.js  environment

## 📁 Project Structure
```Code
DevChat/
│
├── client/          # Frontend application (Vite + TS + Tailwind)
├── server/          # Backend logic, API routes, database access
├── shared/          # Shared types, utilities, and logic
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
├── drizzle.config.ts
│
├── .replit          # Replit environment configuration
├── replit.md        # Replit-specific notes
├── design_guidelines.md
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js  (v18+ recommended)

- npm or pnpm

- (Optional) A Replit account if running in the cloud

### Installation

Clone the repository:
```bash
git clone https://github.com/developer51709/DevChat.git
cd DevChat
```

Install dependencies:

```bash
npm install
```

### Running the App

Start the development environment:

```bash
npm run dev
```

This will run both the client and server (depending on your setup) or start the Vite dev server for the frontend.

## 🧱 Tech Stack

| Layer |	Technology |
|-------|------------|
| Frontend | TypeScript, Vite, Tailwind CSS |
| Backend | TypeScript, Node.js|
| Database | Drizzle ORM (SQL dialect depends on your config)|
| Shared | Type-safe models & utilities|
| Deployment | Replit (optional)|

## 🛠️ Development Notes
The project is intentionally lightweight and modular.

Shared types help keep the client and server in sync.

Tailwind enables fast UI iteration.

Drizzle ORM provides a clean, type‑safe database layer.

## 📌 Roadmap / Todo
Planned improvements:

- Message editing

- Message deletion

- Profile & account settings

- Account recovery options

- Real-time messaging (WebSockets or similar)

- UI improvements and theming

- Better error handling and validation

- Staff roles and channels

- DM channels

## 🤝 Contributing
Contributions, ideas, and suggestions are welcome.
Feel free to open an issue or submit a pull request.

## 📄 License
This project currently has no license specified.
