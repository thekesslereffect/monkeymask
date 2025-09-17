# 🚀 Getting Started with MonkeyMask dApp Template

This guide will help you get up and running with the MonkeyMask dApp template in just a few minutes.

## 📋 Prerequisites

Before you begin, make sure you have:

- **Node.js 18+** installed on your system
- **npm** or **yarn** package manager
- **MonkeyMask browser extension** installed and set up
- Basic knowledge of **React** and **TypeScript**

## 🛠️ Installation

### 1. Clone or Download the Template

```bash
# If using git
git clone <repository-url>
cd monkeymask-dapp-template

# Or download and extract the ZIP file
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Project Structure

```
src/
├── app/
│   └── page.tsx              # Main application page
├── components/
│   ├── WalletConnection.tsx  # Wallet connection UI
│   ├── ApiTester.tsx         # Interactive API testing
│   └── Documentation.tsx    # Code examples and docs
├── hooks/
│   └── useMonkeyMask.ts     # Custom wallet hook
└── types/
    └── monkeymask.ts        # TypeScript definitions
```

## 🐒 MonkeyMask Integration

### 1. Install MonkeyMask Extension

Make sure you have the MonkeyMask browser extension installed:
- Download from the Chrome Web Store (link TBD)
- Or load the unpacked extension from the MonkeyMask repository

### 2. Set Up a Test Wallet

1. Open MonkeyMask extension
2. Create a new wallet or import existing one
3. Make sure you have some test BAN for transactions

### 3. Test the Integration

1. Open the dApp at [http://localhost:3000](http://localhost:3000)
2. Click "Connect Wallet" 
3. Approve the connection in MonkeyMask
4. Try the various API methods in the demo

## 💡 Quick Examples

### Basic Connection

```typescript
import { useMonkeyMask } from '@/hooks/useMonkeyMask';

function MyComponent() {
  const { isConnected, connect, publicKey } = useMonkeyMask();

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }

  return <p>Connected: {publicKey}</p>;
}
```

### Send Transaction

```typescript
const { sendTransaction } = useMonkeyMask();

const handleSend = async () => {
  try {
    const result = await sendTransaction('ban_1recipient...', '1.0');
    console.log('Transaction sent:', result.hash);
  } catch (error) {
    console.error('Transaction failed:', error.message);
  }
};
```

## 🎨 Customization

### Styling

The template uses Tailwind CSS for styling. You can:

1. **Modify colors and themes** in `tailwind.config.js`
2. **Update component styles** directly in the component files
3. **Add custom CSS** in `src/app/globals.css`

### Components

All components are modular and can be customized:

- **WalletConnection**: Modify the connection UI and states
- **ApiTester**: Add new API methods or change the interface
- **Documentation**: Update code examples and guides

### Hook Customization

The `useMonkeyMask` hook can be extended with additional functionality:

```typescript
// Add custom methods to the hook
const useMonkeyMaskExtended = () => {
  const base = useMonkeyMask();
  
  const customMethod = async () => {
    // Your custom logic here
  };
  
  return {
    ...base,
    customMethod
  };
};
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically with each push

### Deploy to Other Platforms

The template works with any platform that supports Next.js:
- Netlify
- AWS Amplify
- DigitalOcean App Platform
- Self-hosted with PM2

## 🔍 Troubleshooting

### MonkeyMask Not Detected

If the dApp shows "MonkeyMask not found":

1. Make sure the extension is installed and enabled
2. Refresh the page after installing the extension
3. Check browser console for any errors
4. Try in an incognito window to rule out conflicts

### Connection Issues

If wallet connection fails:

1. Make sure MonkeyMask is unlocked
2. Check that you're on the correct network
3. Try disconnecting and reconnecting
4. Clear browser cache and cookies

### Build Errors

If you encounter build errors:

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Make sure you're using Node.js 18+
4. Check for TypeScript errors with `npm run type-check`

## 📚 Learning Resources

### Documentation
- Browse the built-in documentation tab in the dApp
- Check out the API reference and code examples
- Review the best practices section

### Community
- Join the Banano Discord community
- Follow MonkeyMask updates on social media
- Contribute to the project on GitHub

## 🤝 Contributing

Found a bug or want to add a feature?

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This template is open source and available under the MIT License.

---

**Happy coding! 🐒🍌**

If you build something cool with this template, we'd love to hear about it!
