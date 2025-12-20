export interface TrainingClass {
  id: string;
  title: string;
  description: string;
  intensity: 'High' | 'Medium' | 'Low';
  image: string;
  duration: string;
}

export interface Trainer {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
}