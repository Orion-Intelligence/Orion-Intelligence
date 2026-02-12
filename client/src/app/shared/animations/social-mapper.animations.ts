export const socialMapperAnimations = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-dropdown {
      animation: slideDown 0.1s ease-out forwards;
      transform-origin: top left;
  }

  .animate-dropdown-right {
      animation: slideDown 0.1s ease-out forwards;
      transform-origin: top right;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .animate-fade-in {
      animation: fadeIn 0.4s ease-in-out;
  }

  @keyframes slideInUp {
    from {
        opacity: 0;
        transform: translateY(1rem) scale(0.98);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
  }

  .animate-fade-in-scale {
      animation: slideInUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  }

  .animate-context-menu-in {
    animation: slideDown 0.1s ease-out forwards;
    transform-origin: top left;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(0.5rem);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.4s ease-out backwards;
  }
`;