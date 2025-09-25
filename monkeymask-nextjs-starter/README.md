# MonkeyMask NextJS Starter Template

A modern Next.js starter template with MonkeyMask integration for Banano cryptocurrency functionality.

## Features

- 🚀 **Next.js 15** with App Router and Turbopack
- 🎭 **MonkeyMask Integration** - Connect to Banano wallets
- 💰 **Donation System** - Built-in Banano donation functionality
- 🎨 **Modern UI** - Tailwind CSS with Radix UI components
- 📱 **Responsive Design** - Mobile-first approach
- ⚡ **TypeScript** - Full type safety
- 🔧 **ESLint** - Code quality and consistency

## Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- A Banano wallet (for testing donations)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/thekesslereffect/monkeymask/tree/main/monkeymask-nextjs-starter
   cd monkeymask-nextjs-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see your application.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint for code quality

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── ConnectButton.tsx # MonkeyMask connection
│   ├── DonateButton.tsx  # Banano donation functionality
│   └── FunctionalitySection.tsx
├── providers/            # Context providers
├── lib/                  # Utility functions
└── types/               # TypeScript type definitions
```

## Key Components

- **ConnectButton** - Handles MonkeyMask wallet connection
- **DonateButton** - Support the project
- **FunctionalitySection** - Showcases MonkeyMask features

## Getting Started with MonkeyMask

1. Install the [MonkeyMask browser extension](https://monkeymask.cc/)
2. Create or import a Banano wallet
3. Connect your wallet using the ConnectButton component
4. Test donation functionality

## Customization

- Modify `app/page.tsx` to customize the main page
- Update `app/globals.css` for global styles
- Add new components in the `components/` directory
- Configure Tailwind CSS in `tailwind.config.js`

## Learn More

- [MonkeyMask Documentation](https://monkeymask.cc/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

This project is open source and available under the [MIT License](LICENSE).
