# FamX Splitter

FamX Splitter is a modern, intuitive web application designed to help families and groups easily track, manage, and split shared expenses during trips or events. 

## Features

- **Expense Tracking:** Quickly add and categorize shared expenses.
- **Fair Splitting:** Automatically calculate who owes whom to ensure everyone pays their fair share.
- **Detailed Insights:** View individual expense details and total trip costs.
- **Modern UI:** A clean, responsive interface built with Next.js and Tailwind CSS.
- **Secure Data:** Backend powered by Supabase for reliable data storage and authentication.

## Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), React, [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database:** [Supabase](https://supabase.com/)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Supabase account and project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/famx-splitter.git
   cd famx-splitter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Rename `.env.example` to `.env` or `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3030](http://localhost:3030) with your browser to see the result.

## License

This project is open-source and available under the [MIT License](LICENSE).
