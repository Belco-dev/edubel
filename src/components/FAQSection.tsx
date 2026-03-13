import { HelpCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Is my data safe?',
    answer:
      'Absolutely. Edubel processes everything locally on your device. We never see, store, or share your student data.',
  },
  {
    question: 'Can I use this offline?',
    answer:
      'Yes! After the first load, Edubel is designed to work without an internet connection.',
  },
  {
    question: 'How many students can I process at once?',
    answer:
      'There is no limit. Whether you have 10 or 200 students, our local engine handles it in seconds.',
  },
];

export function FAQSection() {
  return (
    <section className="py-12 sm:py-16">
      <div className="container px-4 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-bold">
            Frequently Asked <span className="gradient-text">Questions</span>
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border rounded-xl px-4 sm:px-6 bg-card"
            >
              <AccordionTrigger className="text-left text-sm sm:text-base font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
