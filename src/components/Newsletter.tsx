import { Button } from './ui/button';
import { Input } from './ui/input';
import { Mail } from 'lucide-react';

export function Newsletter() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="w-[1920px] mx-auto px-16">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/10 mb-2">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-primary-foreground">Stay in the Loop</h2>
          <p className="text-primary-foreground/80">
            Subscribe to our newsletter for exclusive offers, new arrivals, and design inspiration
          </p>
          
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
            <Input
              type="email"
              placeholder="Enter your email"
              className="bg-primary-foreground text-foreground border-0 flex-1"
            />
            <Button 
              type="submit" 
              variant="secondary"
              className="whitespace-nowrap"
            >
              Subscribe
            </Button>
          </form>
          
          <p className="text-primary-foreground/60">
            By subscribing, you agree to our Privacy Policy and consent to receive updates
          </p>
        </div>
      </div>
    </section>
  );
}