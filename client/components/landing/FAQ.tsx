import React from 'react';
import FAQItem from './FAQItem';

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: 'אף פעם לא רקדתי. זה בסדר?',
      answer: 'בהחלט! רוב השיעורים שלנו מתאימים למתחילים. אנו מספקים סביבה תומכת לצמיחה והתפתחות בקצב שלך.',
    },
    {
      question: 'מה ללבוש לשיעור?',
      answer: 'לבשו בגדי ספורט נוחים שמאפשרים תנועה חופשית. לגבי נעליים, יש לבדוק את פרטי השיעור הספציפי.',
    },
    {
      question: 'איך מזמינים שיעור?',
      answer: 'ניתן להזמין שיעור דרך האתר או האפליקציה שלנו. פשוט צרו חשבון, בחרו שיעור, ושריינו מקום.',
    },
    {
      question: 'מהי מדיניות הביטולים שלכם?',
      answer: 'ניתן לבטל שיעור עד 12 שעות לפני תחילתו ולקבל החזר מלא או קרדיט. ביטולים בפחות מ-12 שעות אינם ניתנים להחזר.',
    },
    {
      question: 'האם יש הגבלת גיל?',
      answer: 'השיעורים הרגילים שלנו מיועדים למבוגרים (18+). אנו מציעים תוכניות נפרדות לילדים ובני נוער. אנא בדקו את לוח הזמנים שלנו לפרטים נוספים.',
    },
    {
      question: 'האם אתם מציעים שיעורים פרטיים?',
      answer: 'כן, בהחלט! רבים מהמדריכים שלנו מציעים שיעורים פרטיים. אנא צרו קשר לקבלת מידע נוסף ותיאום שיעור.',
    },
  ];

  return (
    <section className="bg-slate-800 py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white text-center mb-12">
          שאלות נפוצות
        </h2>
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
