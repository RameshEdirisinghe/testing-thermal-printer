import { DiagnosticTestDefinition } from '../types/test';

export const DIAGNOSTIC_TESTS: DiagnosticTestDefinition[] = [
  {
    id: 'test_a',
    name: 'Test A: Connection & Channel Test',
    category: 'connection',
    description: 'Verifies active transport connectivity, reports device identification, and validates bidirectional channel capabilities.',
    requiresHardwarePrint: false,
    expectedVisualDescription: 'No physical printout expected. Confirms active hardware/transport handshake and connection parameters in dashboard.'
  },
  {
    id: 'test_b',
    name: 'Test B: Basic Text Print Test',
    category: 'text',
    description: 'Prints header, current timestamp, printer identification, left/center/right alignment samples, numbers, and punctuation.',
    requiresHardwarePrint: true,
    expectedVisualDescription: 'A receipt slip with centered title, date/time, left-aligned standard text, right-aligned numbers, and character punctuation set.'
  },
  {
    id: 'test_c',
    name: 'Test C: Paper Width & Alignment Test',
    category: 'layout',
    description: 'Prints character column rulers, alignment tests, edge boundary markers, and long lines matching the active profile width.',
    requiresHardwarePrint: true,
    expectedVisualDescription: 'Diagnostic grid with horizontal column rulers (e.g. 1-32 or 1-48), boundary edge brackets [ ], and edge-to-edge hyphen rules.'
  },
  {
    id: 'test_d',
    name: 'Test D: Text Formatting & Emphasis Test',
    category: 'text',
    description: 'Tests bold/emphasis, double-height, double-width, 2x2 expanded text, underline, and inverted black-on-white text styles.',
    requiresHardwarePrint: true,
    expectedVisualDescription: 'Distinct text lines demonstrating Bold, Underlined, Inverted, Double-Height, Double-Width, and Expanded 2x2 font sizes.'
  },
  {
    id: 'test_e',
    name: 'Test E: 1D Barcode Test',
    category: 'graphics',
    description: 'Generates and transmits standard CODE128 barcode with human-readable text (HRI) underneath. Supports smartphone scan test.',
    requiresHardwarePrint: true,
    expectedVisualDescription: 'A crisp 1D barcode labeled "TEST-128-OK" with human-readable digits printed beneath. Should be scannable with a barcode reader.'
  },
  {
    id: 'test_f',
    name: 'Test F: 2D QR Code Test',
    category: 'graphics',
    description: 'Generates standard ESC/POS 2D QR code with error correction and human-readable URL text below.',
    requiresHardwarePrint: true,
    expectedVisualDescription: 'A sharp 2D QR code square encoding "https://thermodiagnostix.dev" with plaintext URL underneath. Scannable with mobile camera.'
  },
  {
    id: 'test_g',
    name: 'Test G: Paper Feed Test',
    category: 'hardware',
    description: 'Sends configurable line feed commands (5 lines) to test platen roller advancement and motor traction.',
    requiresHardwarePrint: true,
    expectedVisualDescription: 'The thermal paper advances smoothly by 5 blank lines without printing characters.'
  },
  {
    id: 'test_h',
    name: 'Test H: Auto Cutter Test',
    category: 'hardware',
    description: 'Sends partial cut command. Only available if printer profile supports auto cutter. Safety confirmation required.',
    requiresHardwarePrint: true,
    requiresConfirmationModal: true,
    expectedVisualDescription: 'The printer feeds paper and the mechanical cutter blade actuates, performing a partial cut.'
  },
  {
    id: 'test_i',
    name: 'Test I: Real-time Status Query Test',
    category: 'hardware',
    description: 'Sends ESC/POS DLE EOT status query to read sensor states: paper out, cover open, offline flags.',
    requiresHardwarePrint: false,
    expectedVisualDescription: 'Displays sensor state returned from printer or reports "Not supported" if bidirectional communication is unavailable.'
  },
  {
    id: 'test_j',
    name: 'Test J: Stress & Reliability Test',
    category: 'stress',
    description: 'Executes configurable sequential print iterations with pacing delay to test transport reliability, buffer stability, and error recovery.',
    requiresHardwarePrint: true,
    requiresConfirmationModal: true,
    expectedVisualDescription: 'Multiple sequential test slips printed with iteration counters and zero dropped packets.'
  }
];
