import typescript from "@zemd/eslint-ts";

export default [
  ...typescript(),
  {
    name: "nest-pino/override",
    rules: {
      "@typescript-eslint/no-extraneous-class": ["off"],
      "@typescript-eslint/explicit-module-boundary-types": ["off"],
    },
  },
];
