export const RESULT_ROUTE: Record<string, { seg: string[]; ci: string }> = {
  generic_model: { seg: ['/dashboard', 'strategic', 'all'], ci: 'strategic' },
  leak_model: { seg: ['/dashboard', 'breach', 'all'], ci: 'leak' },
  exploit_model: { seg: ['/dashboard', 'exploit', 'all'], ci: 'exploit' },
  apt_model: { seg: ['/dashboard', 'apt-intel', 'apt'], ci: 'apt' },
  malware_model: { seg: ['/dashboard', 'apt-intel', 'malware'], ci: 'malware' },
  defacement_model: { seg: ['/dashboard', 'defacement', 'all'], ci: 'defacement' },
  social_model: { seg: ['/dashboard', 'social', 'all'], ci: 'social' },
  chat_model: { seg: ['/dashboard', 'social', 'chat', 'all'], ci: 'chat' }
};
