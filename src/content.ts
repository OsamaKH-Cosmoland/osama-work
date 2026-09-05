/**
 * Every word that appears on the page lives here.
 *
 * Voice rules for anything added to this file:
 *   - Short, direct sentences. Plain words.
 *   - Always "I", never "we".
 *   - No corporate language. No hype adjectives.
 *   - No em-dashes, no "not just X, but Y", no exclamation marks.
 *   - Plain beats clever. Do not over-polish.
 */

export const site = {
  name: 'Osama Khaireldin',
  role: 'Freelance web developer',
  location: 'Alexandria, Egypt',
  email: 'osamakhaireldin@gmail.com',
  calendly: 'https://calendly.com/osamakhaireldin/30min',
  whatsapp: 'https://wa.me/201273922868',
  whatsappDisplay: '+20 127 392 2868',
  liveStore: 'https://naturagloss.com',
} as const

export const hero = {
  eyebrow: 'Freelance developer, Alexandria, Egypt',
  headline: 'I build e-commerce stores for small brands in under two weeks.',
  body: 'Coded from scratch, not a theme. Every store ships with automated tests, error monitoring, and uptime checks, so problems reach me before they reach your customers. I stay available after launch.',
  primaryCta: 'Get in touch',
  secondaryCta: 'See what I built',
}

export const different = {
  heading: 'What most freelancers at this price skip',
  intro: 'Four things I set up on every project. They are the difference between a store that works on launch day and a store that keeps working.',
  items: [
    {
      title: 'Automated tests',
      body: 'A script walks through your store the way a customer would and buys a product. It runs before any change goes live. If checkout breaks, the change stops there and never reaches your customers.',
    },
    {
      title: 'Tests run on every change',
      body: 'Those tests run on a server every time I touch the code, not when I remember to run them. A change that fails cannot be deployed, including by me.',
    },
    {
      title: 'Error monitoring',
      body: 'If something breaks for a customer at 2am, I get the error and the exact line that caused it. Often it is fixed before anyone tells me about it.',
    },
    {
      title: 'Uptime monitoring',
      body: 'A service outside your site checks it every few minutes. If the store goes down, my phone wakes me. You should never be the person who tells me the site is offline.',
    },
  ],
}

export const packages = {
  heading: 'Packages',
  intro: 'Prices start here. After one call you get a fixed number in writing.',
  items: [
    {
      name: 'Launch',
      price: 'from $700',
      timeline: 'Delivered in 5 days',
      summary: 'A small store that sells properly on a phone.',
      recommended: false,
      features: [
        'Product pages',
        'Cart and checkout',
        'Mobile-first build',
        'Deployed on Vercel',
        'Analytics and Search Console',
      ],
    },
    {
      name: 'Growth',
      price: 'from $1,500',
      timeline: 'Delivered in 10 to 12 days',
      summary: 'For brands with real business logic behind the sale.',
      recommended: true,
      recommendedLabel: 'Most brands pick this',
      features: [
        'Everything in Launch',
        'Postgres database',
        'Custom logic: shipping calculators, coupons, inventory',
        'Automated tests',
        'CI on GitHub Actions',
        'Sentry error monitoring',
        'Uptime monitoring',
        'Telegram bot for order notifications',
      ],
    },
    {
      name: 'Care',
      price: '$200',
      priceSuffix: 'per month',
      timeline: 'Offered with every project',
      summary: 'Someone watching the store after launch.',
      recommended: false,
      features: [
        'Monitoring',
        'Backups',
        'Dependency updates',
        'Bug fixes',
        'A report every month',
      ],
    },
  ],
}

export const process = {
  heading: 'How I work',
  steps: [
    {
      title: 'Call and scope',
      body: 'You tell me what you sell and what the store has to do. I ask questions until the scope is clear. 30 minutes, no charge.',
    },
    {
      title: 'Fixed quote and timeline',
      body: 'You get a price and a delivery date in writing. Neither one moves unless you ask for something new.',
    },
    {
      title: 'Build, with updates',
      body: 'I send you a working link every few days. You click through it and tell me what is wrong while it is still cheap to change.',
    },
    {
      title: 'Launch and handover',
      body: 'I deploy it, hand over the code and every account, and walk you through how it works. Anything broken in the first 30 days I fix at no cost.',
    },
  ],
}

export const caseStudy = {
  label: 'A brand I founded and run. Not client work.',
  heading: 'Natura Gloss',
  subheading: 'D2C handmade cosmetics, Egypt',
  liveLinkLabel: 'View the live store',
  problem: {
    title: 'Problem',
    body: 'I sell handmade cosmetics in Egypt. Shipping costs are different in every governorate, so a flat rate either loses money or scares customers away. Almost everyone buys on a phone. And I needed to know about an order the moment it happened, without sitting in front of a dashboard.',
  },
  built: {
    title: 'What I built',
    body: 'A store in React, Node, and TypeScript, deployed on Vercel.',
    points: [
      'Shipping cost calculated automatically from the delivery address, using real Egyptian courier rates',
      'Checkout built for a phone first, with the steps cut down to reduce abandoned carts',
      'A Telegram bot I wrote that sends me every order the second it is placed',
      'Jest tests and GitHub Actions CI, so a change cannot break checkout without me knowing',
      'Sentry and uptime monitoring running in production',
    ],
  },
  result: {
    title: 'Result',
    body: 'The store runs without me watching it. Shipping is correct at checkout instead of being fixed by hand after the order comes in. Every order reaches my phone in seconds. When something breaks, Sentry tells me before a customer does. I run this exact setup on my own store first, then install it for clients. The numbers below are before and after a performance pass I ran on the store on 5 September 2026, measured in Google PageSpeed Insights on mobile.',
    /**
     * Measured on Natura Gloss, my own store, before and after a performance pass
     * on 5 September 2026. PageSpeed Insights, mobile profile (Moto G Power,
     * slow 4G). The date and the fact that this is my own store are stated in
     * `body` above, so the numbers cannot be rendered without their context and
     * read as client results.
     *
     * Still worth adding when you have them: orders handled (count Telegram
     * notifications), uptime (your monitor already computes it), mobile traffic
     * share (Vercel Analytics, Devices tab).
     *
     * Only put numbers here you can say out loud on a call without checking.
     */
    metrics: [
      { value: '80 → 100', label: 'PageSpeed score, mobile' },
      { value: '3.8s → 2.7s', label: 'Largest Contentful Paint' },
      { value: '85 → 100', label: 'Accessibility score' },
      { value: '92 → 100', label: 'SEO score' },
      { value: '1.4MB → 256KB', label: 'Homepage images, 82% smaller' },
      { value: 'under 2px', label: 'Layout drift across a 14,000px page' },
    ] as { value: string; label: string }[],
  },
  stack: ['React', 'Node.js', 'TypeScript', 'Postgres', 'Vercel', 'Jest', 'GitHub Actions', 'Sentry'],
}

export const about = {
  heading: 'About me',
  /** Drop a file in /public and set this to e.g. '/osama.jpg'. Layout works either way. */
  photo: null as string | null,
  photoAlt: 'Osama Khaireldin',
  paragraphs: [
    'I am a freelance developer based in Alexandria, Egypt.',
    'I started as a trainee, then worked as a developer at CosmoLand from 2023 to 2026, building web app components and responsive interfaces.',
    'Now I work for myself and run my own e-commerce brand, which is where most of what I know about selling online actually came from.',
    'I work in React, Node, TypeScript, Postgres, and MongoDB.',
  ],
}

export const faq = {
  heading: 'Questions',
  items: [
    {
      q: 'What does "from" mean in the prices?',
      a: 'The price moves with scope. How many products, whether you need custom logic like shipping rules or coupons, and how much design work is involved. After one call I send you a fixed number, and that number does not change unless you add something to the scope.',
    },
    {
      q: 'What happens if the project takes longer than you said?',
      a: 'The date I put in writing is mine to keep. If I am late for a reason that is my fault, you do not pay for the extra days. If the delay is on your side, usually waiting for product photos or copy, I tell you the day it starts affecting the date rather than at the end.',
    },
    {
      q: 'Who owns the code?',
      a: 'You do, once the final payment clears. The GitHub repository transfers to your account along with every service account I set up for the project. Nothing is licensed to you and nothing is locked to me. You can hand it to another developer the next day.',
    },
    {
      q: 'Do you work with agencies white-label?',
      a: 'Yes. I can build under your name and stay invisible to your client, or join calls as part of your team. I am comfortable signing an NDA.',
    },
    {
      q: 'What timezone are you in, and how fast do you reply?',
      a: 'Alexandria, Egypt. EET, UTC+2. That is two hours ahead of London and one hour ahead of most of Europe, so the working day overlaps almost completely. I reply within a few hours on weekdays.',
    },
    {
      q: 'What happens after launch?',
      a: 'You get 30 days of free bug fixes. After that you can take the Care plan at $200 a month, or take the code and run it yourself. I do not lock anyone into a retainer to get the project.',
    },
  ],
}

export const contact = {
  heading: 'Book a call',
  intro: 'Tell me what you are building. If it is not something I can do well, I will say so on the call.',
  formTitle: 'Send me the details',
  calendlyTitle: 'Pick a time',
  calendlyBody: 'Thirty minutes. I will ask about your products, your timeline, and what the store has to do.',
  whatsappTitle: 'Message me',
  whatsappBody: 'Fastest way to reach me. Good for quick questions before you book anything.',
  emailTitle: 'Email',
  budgets: [
    'Under $700',
    '$700 to $1,500',
    '$1,500 to $3,000',
    'Over $3,000',
    'Not sure yet',
  ],
  success: 'Got it. I will reply within a few hours on a weekday.',
  errorGeneric: 'Something went wrong sending that. You can email me directly at osamakhaireldin@gmail.com.',
}

export const footer = {
  tagline: 'E-commerce stores for small brands. Built to keep working.',
}
