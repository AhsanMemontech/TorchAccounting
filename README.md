# Uncouple - AI-Powered Uncontested Divorce Tool

Uncouple is an AI-powered web application designed to streamline the uncontested divorce process for New York State residents. The platform guides users through eligibility checks, process overview, information collection, form generation, and provides clear next steps.

## Features

- **Eligibility Check**: Interactive questionnaire to validate uncontested divorce eligibility
- **Process Overview**: Clear explanation of the divorce process, timelines, and expectations
- **Information Collection**: Secure collection of personal and marriage details
- **Form Generation**: AI-powered generation of all required New York State divorce forms
- **Next Steps Guidance**: Clear instructions on what to do with completed forms
- **Payment Integration**: Secure payment processing (coming soon)
- **Legal Consultation**: Option to schedule time with qualified attorneys (coming soon)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd uncouple
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Reusable components (to be added)
├── lib/               # Utility functions (to be added)
└── types/             # TypeScript type definitions (to be added)
```

## Development Roadmap

### Phase 1: MVP (Current)
- [x] Landing page with process overview
- [ ] Eligibility questionnaire
- [ ] Process explanation page
- [ ] Information collection forms
- [ ] Form generation system
- [ ] Next steps guidance

### Phase 2: Enhanced Features
- [ ] Payment gateway integration
- [ ] Legal consultation scheduling
- [ ] User accounts and progress saving
- [ ] Document storage and management

### Phase 3: Advanced Features
- [ ] Multi-state support
- [ ] Advanced form customization
- [ ] Integration with court filing systems
- [ ] Mobile app development

## Legal Disclaimer

This application is designed to assist with uncontested divorce proceedings in New York State. It is not a substitute for legal advice, and users are encouraged to consult with qualified attorneys for complex legal matters.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@uncoupleus.com or visit our help center.
