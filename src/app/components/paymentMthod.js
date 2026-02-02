import RazorpayCheckout from 'react-native-razorpay';
import {RAZORPAY_KEY_ID} from '@env';

const payment = async ({payload, userData}) => {
  try {
    // Validate key
    if (!RAZORPAY_KEY_ID) {
      throw new Error('Razorpay Key ID is missing');
    }

    // Validate amount
    const parsedAmount = Number(payload?.amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Invalid payment amount');
    }

    const options = {
      description: 'Buy BMW CAR',
      image: 'https://i.imgur.com/3g7nmJC.png',
      currency: 'INR',
      key: RAZORPAY_KEY_ID,
      amount: parsedAmount * 100, // Amount in paisa (100 INR = 10000)
      name: 'Markletech',
      prefill: {
        email: userData?.email || 'test@example.com',
        contact: userData?.mobile_number || '9999999999',
        name: `${userData?.first_name ?? 'User'} ${
          userData?.last_name ?? ''
        }`.trim(),
      },
      theme: {color: '#F37254'},
      // order_id is NOT included here, so Razorpay will auto-capture payment
    };

    const data = await RazorpayCheckout.open(options);

    // Payment was successful & auto-captured
    alert(`✅ Payment Successful!\nPayment ID: ${data.razorpay_payment_id}`);

    // Optionally, save transaction to your DB
    console.log('Payment success data:', data);
  } catch (error) {
    if (error?.description && error?.code) {
      // Razorpay-specific error
      alert(
        `❌ Payment Failed\nCode: ${error.code}\nMessage: ${error.description}`,
      );
    } else {
      // Validation or unexpected errors
      console.error('Payment error:', error);
      alert(`❌ Error: ${error.message || 'Something went wrong'}`);
    }
  }
};

export default payment;
