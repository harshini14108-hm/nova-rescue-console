# Order Rescue Console

Build a web app called "NOVA CART Rescue Console".

Problem: NOVA CART is a fictional quick-commerce app. Orders are growing, but customers stop reordering because of late deliveries and cancellations.

The app should:

1. Show 200 fake orders with a Risk Score (0-100): High, Medium or Low, colored red, yellow or green.

2. Have buttons on risky orders: Reassign Rider, Send Apology Coupon, Substitute Item. After clicking, show the risk going down.

3. Show a chart: customers with a late first order come back less than customers with an on-time first order.

4. Show why orders fail: out of stock, no riders, peak hour rush.

5. Have two sliders: "reduce late orders" and "reduce cancellations". They show how much money is saved.

6. Have a summary page with the main message: "Growth is hiding a delivery problem."

Make all buttons work. Use fake data and label it "Simulated data". Don't ask me questions, just build it.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nova-rescue-console.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c6816e84-3af6-5863-bad8-4db268e32dce).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
