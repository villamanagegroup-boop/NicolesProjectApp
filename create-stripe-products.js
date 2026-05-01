require('dotenv').config({ path: '.env.local' });
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  try {
    console.log('Creating Stripe products...\n');

    // 365 Cards: $9/month (recurring)
    console.log('Creating 365 Cards product...');
    const cardsProduct = await stripe.products.create({
      name: '365 Cards',
      description: 'Access to the daily cards only',
    });
    console.log('✓ Product created:', cardsProduct.id);

    console.log('Creating 365 Cards price...');
    const cardsPrice = await stripe.prices.create({
      product: cardsProduct.id,
      unit_amount: 900,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✓ Price created:', cardsPrice.id, '\n');

    // Seal the Leak: $37 one-time
    console.log('Creating Seal the Leak product...');
    const leakProduct = await stripe.products.create({
      name: 'Seal the Leak',
      description: 'Complete program access - one time purchase',
    });
    console.log('✓ Product created:', leakProduct.id);

    console.log('Creating Seal the Leak price...');
    const leakPrice = await stripe.prices.create({
      product: leakProduct.id,
      unit_amount: 3700,
      currency: 'usd',
    });
    console.log('✓ Price created:', leakPrice.id, '\n');

    // The Circle: $497 one-time
    console.log('Creating The Circle (One-Time) product...');
    const circleOnetimeProduct = await stripe.products.create({
      name: 'The Circle - Full Access',
      description: 'Premium program - full access, one time payment',
    });
    console.log('✓ Product created:', circleOnetimeProduct.id);

    console.log('Creating The Circle (One-Time) price...');
    const circleOnetimePrice = await stripe.prices.create({
      product: circleOnetimeProduct.id,
      unit_amount: 49700,
      currency: 'usd',
    });
    console.log('✓ Price created:', circleOnetimePrice.id, '\n');

    // The Circle: $197/month for 3 months
    console.log('Creating The Circle (Monthly) product...');
    const circleMonthlyProduct = await stripe.products.create({
      name: 'The Circle - Premium Monthly',
      description: 'Premium program - 3-month payment plan',
    });
    console.log('✓ Product created:', circleMonthlyProduct.id);

    console.log('Creating The Circle (Monthly) price...');
    const circleMonthlyPrice = await stripe.prices.create({
      product: circleMonthlyProduct.id,
      unit_amount: 19700,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
    });
    console.log('✓ Price created:', circleMonthlyPrice.id, '\n');

    console.log('='.repeat(70));
    console.log('✓ SUCCESS! All products created.\n');
    console.log('ADD THESE TO .env.local:\n');
    console.log(`STRIPE_PRODUCT_CARDS=${cardsProduct.id}`);
    console.log(`STRIPE_PRICE_CARDS=${cardsPrice.id}`);
    console.log(`STRIPE_PRODUCT_LEAK=${leakProduct.id}`);
    console.log(`STRIPE_PRICE_LEAK=${leakPrice.id}`);
    console.log(`STRIPE_PRODUCT_CIRCLE_ONETIME=${circleOnetimeProduct.id}`);
    console.log(`STRIPE_PRICE_CIRCLE_ONETIME=${circleOnetimePrice.id}`);
    console.log(`STRIPE_PRODUCT_CIRCLE_MONTHLY=${circleMonthlyProduct.id}`);
    console.log(`STRIPE_PRICE_CIRCLE_MONTHLY=${circleMonthlyPrice.id}`);
    console.log('\n⚠️  NOTE: Create promo code ngadmin100 (100% off) manually in Stripe Dashboard');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Type:', error.type);
    if (error.raw) {
      console.error('Raw error:', error.raw);
    }
    process.exit(1);
  }
}

createProducts();
