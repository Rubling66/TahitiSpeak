// Registers @testing-library/jest-dom matcher types (toBeInTheDocument, etc.)
// for both the global `expect` (@types/jest) and `expect` imported from @jest/globals.
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/jest-globals';
