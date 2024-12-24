export interface TranslationKeys {
  common: {
    createSecret: string;
    starOnGithub: string;
    learnMore: string;
  };
  landing: {
    title: string;
    subtitle: string;
    steps: {
      encrypt: {
        title: string;
        description: string;
      };
      share: {
        title: string;
        description: string;
      };
      autoDelete: {
        title: string;
        description: string;
      };
    };
  };
}

export type TranslationNamespace = keyof TranslationKeys;

export type NestedKeys<T> = T extends string
  ? []
  : {
      [K in keyof T]: [K, ...NestedKeys<T[K]>];
    }[keyof T];

export type TranslationKey = NestedKeys<TranslationKeys>;
