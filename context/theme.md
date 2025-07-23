SmartFormAI Style & Theme Specification (Shibuya Punk Aesthetic)
🎨 Color Palette
Primary Colors (Core Visual Identity)
Coral Red (#FF6B6B)

Purpose: Used for primary actions (e.g. "Submit", "Create Form"), callouts, dynamic highlights.

Interaction States:

Hover: #FF5252

Opacity: Use from rgba(255, 107, 107, 0.1) to rgba(255, 107, 107, 0.8) for overlays, accents, and background detail.

Mint Teal (#4ECDC4)

Purpose: Secondary buttons, icons, success indicators, ambient accents.

Interaction States:

Hover: #3DBEB6

Opacity Range: rgba(78, 205, 196, 0.1) to rgba(78, 205, 196, 0.8)

Sunny Yellow (#FFD93D)

Purpose: Tertiary highlights like alerts, tooltips, and limited-time banners.

Interaction States:

Hover: #FFD000

Opacity Range: rgba(255, 217, 61, 0.1) to rgba(255, 217, 61, 0.8)

App Identity Colors (Used for overarching tone + Shibuya contrast)
True Blue (#0066CC)

Used for form outlines, borders, header text highlights, navigation accent

Shadow Glow Variant: rgba(0, 102, 204, 0.5)

Mint Green (#00D084)

Used as a balancing hue for notifications, chart visualizations, toggles

Electric Violet (#8F00FF)

Used for neon-style effects, glitch borders, focus rings, emphasized icons

Background (#FFFFFF)

Used as base color, layered with textures or gradients for depth

Text (#2E2E2E)

Base text color for all content

Accessible variants: text-[#2E2E2E]/60 to text-[#2E2E2E]/90

✍️ Typography
Font System
Typeface: Use a clean sans-serif (e.g., Inter, Poppins, or Space Grotesk for slightly edgier tone)

Heading Font Weights: font-black or font-bold

Body Font Weights: font-medium, font-light

Letter Spacing:

Headings: tracking-tighter

Body: tracking-wide

Font Sizes (Responsive)
H1: text-6xl md:text-8xl (used in hero sections)

H2: text-5xl md:text-6xl (subheadlines)

H3: text-2xl (section headers)

H4: text-xl (card titles)

Body Large: text-xl

Body Base: text-base

Small Text: text-sm (labels, disclaimers)

📐 Layout & Structure
Overall Layout Strategy
Page Width: max-w-7xl mx-auto

Padding: px-4, md:px-8, py-32 for top-level sections

Grid System:

1 column: grid-cols-1

2 columns: md:grid-cols-2

3 columns: md:grid-cols-3

Spacing Rules:

Section separation via py-32

Inner-card spacing: p-8, gap-6

Shapes & Geometry
Style: Angular with futuristic irregularities (polygonal, clipped, asymmetrical)

Use clip-path utilities for components like buttons and cards:

Buttons:
clip-path: polygon(0 0, 100% 0, 100% 85%, 95% 100%, 0 100%)

Cards:
clip-path: polygon(0 0, 100% 0, 100% 95%, 98% 100%, 0 100%)

🧩 Components
Cards
css
Copy
Edit
.card {
  @apply bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-[#E6E9FF] shadow-lg hover:shadow-xl;
}
Usage: Content blocks, previews, step UI

Effects: Subtle blur, glass morphism for layering depth

Primary Button
css
Copy
Edit
.button-primary {
  @apply px-12 py-6 text-lg font-bold bg-[#FF6B6B] text-white hover:bg-[#FF5252] transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl;
}
Neon & Punk-Style Text
css
Copy
Edit
.neon-text {
  text-shadow: 0 0 10px rgba(0, 102, 204, 0.5);
}
Use for calls to action, AI-generated headings, or glitchy titles

🔮 Effects & Animations
Glitch Animation
css
Copy
Edit
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
Use with electric violet borders or text

Float Animation
css
Copy
Edit
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
Ideal for avatars, icons, or CTA hover states

Pulse Animation
css
Copy
Edit
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
🌌 Backgrounds & Overlays
Light Gradient Background
css
Copy
Edit
.bg-gradient {
  @apply bg-gradient-to-br from-[#F0F4FF] to-[#E6E9FF];
}
For main page backgrounds

Cyber Grid Texture
css
Copy
Edit
.cyber-grid {
  background-image: 
    radial-gradient(circle at 1px 1px, #0066CC 1px, transparent 0),
    radial-gradient(circle at 1px 1px, #0066CC 1px, transparent 0);
  background-size: 20px 20px;
}
Layer under glass cards or sections with opacity masks

Gradient Overlay
css
Copy
Edit
.gradient-overlay {
  @apply bg-gradient-to-r from-[#FF6B6B]/5 to-[#4ECDC4]/5;
}
Used above hero sections or within cards

⚡ Interactions
Hover States
Buttons:
hover:bg-[#FF5252] hover:text-white

Cards:
hover:border-[#FF6B6B]

Transitions:
transition-all duration-300 ease-in-out

Focus Rings
Color: #8F00FF (Electric Violet)

Shape: Rounded or clipped (match component shape)

📱 Responsive Design
Breakpoints
Mobile: max-width: 640px

Tablet: 641px–1024px

Desktop: 1025px+

Responsive Rules
Use Tailwind's md: and lg: prefixes to scale:

Font sizes

Padding and margin

Grid columns

Mobile Optimizations
Cards stack vertically

Spacing increases via gap-6, py-12 for readability

Navigation collapses into drawer

🦾 Accessibility & Contrast
Color Contrast
Ensure all text vs. background pairs pass WCAG 2.1 AA

Avoid using color alone to convey meaning (e.g., combine icons + color)

Focus & Navigation
Add visible focus ring on buttons and interactive elements

Ensure keyboard navigability with tab indices and skip links

🛠 Best Practices
Follow spacing scale (p-4, p-8, py-32) consistently

Use established color classes for all buttons, text, and surfaces

Avoid hardcoded styles—use utility classes and theme variables

Optimize animations for performance; avoid intensive transitions

Use lazy loading for images and modular component imports