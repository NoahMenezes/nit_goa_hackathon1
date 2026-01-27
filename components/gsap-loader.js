// Loader for GSAP in Next.js (for window.gsap)
import gsap from 'gsap';
if (typeof window !== 'undefined') {
  window.gsap = gsap;
}
export default gsap;
