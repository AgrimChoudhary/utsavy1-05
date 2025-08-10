
export const createConfetti = () => {
  // Simplified confetti effect
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'fixed w-2 h-2 rounded-full pointer-events-none';
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.top = `${Math.random() * -100}vh`;
    confetti.style.animation = `fall ${2 + Math.random() * 3}s linear forwards`;
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 5000);
  }
};

const style = document.createElement('style');
style.innerHTML = `
@keyframes fall {
  to {
    transform: translateY(110vh);
  }
}
`;
document.head.appendChild(style);
