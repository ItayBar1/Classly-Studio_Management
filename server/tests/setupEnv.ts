process.env.NODE_ENV = 'test';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
// paymentService constructs a Stripe client at import time, and the Stripe SDK
// throws on an empty key. Without this every suite that imports the app fails
// to boot. Stripe itself is mocked wherever it is actually exercised.
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
