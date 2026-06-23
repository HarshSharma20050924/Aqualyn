import React from 'react';

export default function PrivacyScreen() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-4xl mx-auto min-h-[80vh]">
      <div className="space-y-6">
        <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">Legal</span>
        <h1 className="text-4xl md:text-6xl font-black font-headline text-on-surface tracking-tight">Privacy Policy</h1>
        <p className="text-on-surface-variant font-medium text-lg md:text-xl leading-relaxed">
          Last updated: {new Date().toLocaleDateString()}
        </p>
        
        <div className="w-20 h-1.5 liquid-gradient rounded-full my-8"></div>

        <div className="prose prose-lg prose-invert max-w-none text-on-surface-variant font-medium space-y-8">
          <p className="text-lg leading-relaxed">
            At Aqualyn, we believe your data is yours. We have designed our communication protocol from the ground up to ensure that we never collect, store, or sell your personal conversations.
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-on-surface mt-12 mb-4">1. Information We Do Not Collect</h2>
          <p className="leading-relaxed">
            Aqualyn does not log IP addresses, device identifiers, or location data. Your chat history is never backed up to our servers. All message data is retained strictly on your local device.
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-on-surface mt-12 mb-4">2. Local Storage</h2>
          <p className="leading-relaxed">
            Because we use a purely local-first architecture, your cryptographic keys and message databases exist solely within the sandboxed partition of your device. If you delete the app or clear its data, that information is permanently unrecoverable.
          </p>

          <h2 className="text-2xl md:text-3xl font-black text-on-surface mt-12 mb-4">3. Contact Synchronization</h2>
          <p className="leading-relaxed">
            We do not upload your address book to our servers. When you search for other users, the lookup is done via hashed, anonymized requests that cannot be reverse-engineered to reveal your contacts.
          </p>
          
          <h2 className="text-2xl md:text-3xl font-black text-on-surface mt-12 mb-4">4. Ephemeral Messaging</h2>
          <p className="leading-relaxed">
            Messages configured to self-destruct are purged from the device's volatile memory and permanent storage simultaneously. There are no "trash" folders or hidden logs where deleted messages reside.
          </p>
        </div>
      </div>
    </div>
  );
}
