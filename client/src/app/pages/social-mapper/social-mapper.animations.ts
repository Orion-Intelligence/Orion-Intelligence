export const socialMapperAnimations = `
  @keyframes scaleInDropdown {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-dropdown {
      animation: scaleInDropdown 0.1s ease-out forwards;
      transform-origin: top left;
  }

  .animate-dropdown-right {
      animation: scaleInDropdown 0.1s ease-out forwards;
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
      animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeInScale {
    from {
        opacity: 0;
        transform: scale(0.95);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
  }

  .animate-fade-in-scale {
      animation: fadeInScale 0.15s ease-out forwards;
  }

  .animate-context-menu-in {
    animation: fadeInScale 0.1s ease-out forwards;
    transform-origin: top left;
  }
`;
