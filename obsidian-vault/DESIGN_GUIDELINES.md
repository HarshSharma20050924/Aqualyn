# Aqualyn Design System & Frontend Guidelines

## 1. The Niche: "Liquid Social Messaging"
Aqualyn is positioned as a **high-fidelity, aesthetic-first** social messaging platform. Unlike the utilitarian design of WhatsApp or the brutalist feel of Telegram, Aqualyn focuses on **fluidity, transparency, and organic motion**. It targets Gen-Z and creative professionals who value UI/UX as much as functionality.

---

## 2. Design Philosophy: "The Liquid UI"
The core of Aqualyn's identity is the **Liquid UI**. This is characterized by:
- **Glassmorphism:** Heavy use of `backdrop-blur` and semi-transparent backgrounds to create depth.
- **Organic Motion:** Every interaction (button click, screen transition, modal open) must be animated using `motion/react`.
- **High Contrast Gradients:** Using vibrant cyan, blue, and purple gradients to signify action and premium feel.
- **Aqua Intensity:** A unique concept where the "glow" and "fluidity" of the UI can be adjusted by the user.

---

## 3. Technical Implementation

### 3.1. Styling Stack
- **Framework:** Tailwind CSS.
- **Icons:** Lucide React (Always use consistent stroke width, default is 2).
- **Animations:** Framer Motion (`motion/react`).

### 3.2. Color Palette (Tailwind Classes)
- **Primary Gradient:** `bg-gradient-to-br from-cyan-600 to-blue-500`
- **Secondary Gradient:** `bg-gradient-to-br from-purple-600 to-pink-500`
- **Surface:** `bg-surface` (Light: Slate-50, Dark: Neutral-900)
- **Glass Card:** `bg-white/10 backdrop-blur-xl border border-white/20`
- **Aqua Glow:** `shadow-[0_0_20px_rgba(6,182,212,0.3)]`

### 3.3. Typography
- **Headings:** `font-headline` (Space Grotesk or Outfit) - Bold, tight tracking.
- **Body:** `font-sans` (Inter) - Clean, legible, variable weight.

---

## 4. Component Patterns

### 4.1. Buttons
- **Action Buttons:** Large, rounded-full, with `liquid-gradient` and a subtle `aqua-glow`.
- **Secondary Buttons:** `glass-panel` with a thin white border and hover scale effect.
- **Interaction:** Always include `whileHover={{ scale: 1.02 }}` and `whileTap={{ scale: 0.95 }}`.

### 4.2. Cards & Containers
- **Border Radius:** Use `rounded-3xl` or `rounded-[2.5rem]` for main containers.
- **Blur:** Always use `backdrop-blur-xl` or `backdrop-blur-3xl` for overlays to maintain the "liquid" feel.

### 4.3. Modals & Sheets
- **Entrance:** Slide up from bottom with `type: "spring", damping: 25, stiffness: 200`.
- **Background:** `bg-black/60 backdrop-blur-sm`.

---

## 5. Animation Standards
To maintain the "Aqualyn Feel", use these standard transitions:

```typescript
// Standard Spring Transition
const springConfig = { type: "spring", damping: 25, stiffness: 200 };

// Page Transition
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};
```

---

## 6. Rules for AI Component Generation
When building new components for Aqualyn, follow these strict rules:
1. **Never use solid colors for primary actions;** always use the defined gradients.
2. **Never use sharp corners;** minimum radius is `rounded-xl`.
3. **Always wrap interactive elements in `motion.div` or `motion.button`.**
4. **Use `lucide-react` icons exclusively.**
5. **Maintain the "Glass" look:** If a component sits over a background, it must have a blur and a subtle border.
6. **Responsive First:** Use `md:` and `lg:` prefixes to ensure the "Liquid" feel scales to desktop.

---

## 7. AI Prompting Guide for Aqualyn Components
To ensure consistency when generating new components, use the following technical details in your prompts:

### 7.1. Technical Context
- **Framework:** React 18/19, TypeScript.
- **Styling:** Tailwind CSS 4.0.
- **Animations:** Framer Motion (`motion/react`).
- **Icons:** Lucide React.
- **Theme:** Liquid UI (Glassmorphism, High-contrast gradients, Aqua-glow).

### 7.2. Sample Prompt Template
> "Create a new [Component Name] for Aqualyn. Use the **Liquid UI** design system. 
> - **Styling:** Use `rounded-3xl`, `backdrop-blur-xl`, and `bg-white/10` for the container. 
> - **Colors:** Primary action should use `bg-gradient-to-br from-cyan-600 to-blue-500` with an `aqua-glow`. 
> - **Animations:** Use `motion/react` for entry (`initial={{ opacity: 0, y: 20 }}`) and interactions (`whileHover={{ scale: 1.02 }}`). 
> - **Icons:** Use `lucide-react` with a stroke width of 2. 
> - **Typography:** Use `font-headline` for titles and `font-sans` for body text."

---

**Prepared by:** Lead Frontend Architect
**Project:** Aqualyn Social Messenger
