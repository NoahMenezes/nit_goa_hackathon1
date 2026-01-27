// GSAP Animations for Demo Page
window.addEventListener('DOMContentLoaded', () => {
  // Animate main header
  gsap.from('#main-header', {
    duration: 1.2,
    y: -60,
    opacity: 0,
    ease: 'bounce.out'
  });
  // Animate sub-header with random text effect
  gsap.fromTo('#sub-header', {
    text: 'Dynamic Website Showcase',
    opacity: 0
  }, {
    duration: 1.5,
    text: 'Dynamic Website Showcase',
    opacity: 1,
    ease: 'power2.out',
    delay: 0.5
  });
  // Animate nav links
  gsap.from('nav li', {
    duration: 0.8,
    y: 30,
    opacity: 0,
    stagger: 0.15,
    ease: 'back.out(1.7)'
  });
  // Animate sections
  gsap.from('main section', {
    duration: 1,
    y: 40,
    opacity: 0,
    stagger: 0.2,
    ease: 'power1.out',
    delay: 0.5
  });
  // Animate cards and map demo
  gsap.from('.card, .map-demo, .team-member', {
    duration: 1,
    scale: 0.8,
    opacity: 0,
    stagger: 0.2,
    ease: 'elastic.out(1, 0.5)',
    delay: 1
  });
  // Animate forms
  gsap.from('.demo-form input, .demo-form button', {
    duration: 0.7,
    x: -40,
    opacity: 0,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 1.2
  });
});