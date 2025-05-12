module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "rules": {
    // Prevent duplicate exports
    "no-dupe-class-members": "error",

    // Additional helpful rules
    "no-unused-vars": "warn",
    "no-undef": "error",
    "no-console": ["warn", { "allow": ["warn", "error", "info"] }]
  }
};
