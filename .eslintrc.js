module.exports = {
  extends: ["plugin:react/recommended", "prettier"],
  plugins: ["react"],
  rules: {
    "react/jsx-curly-spacing": ["error", { when: "always", children: true }],
  },
};
