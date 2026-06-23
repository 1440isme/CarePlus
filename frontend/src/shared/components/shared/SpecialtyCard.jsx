import { Link } from 'react-router-dom';
import {
  Heart, Bone, Baby, Sparkles, Activity, HeartPulse, Stethoscope, Ear, ArrowRight
} from 'lucide-react';

const iconMap = {
  Heart: <Heart className="w-6 h-6" />,
  Bone: <Bone className="w-6 h-6" />,
  Baby: <Baby className="w-6 h-6" />,
  Sparkles: <Sparkles className="w-6 h-6" />,
  Activity: <Activity className="w-6 h-6" />,
  HeartPulse: <HeartPulse className="w-6 h-6" />,
  Stethoscope: <Stethoscope className="w-6 h-6" />,
  Ear: <Ear className="w-6 h-6" />,
};

const colorClasses = [
  'bg-red-50 text-red-600',
  'bg-blue-50 text-blue-600',
  'bg-green-50 text-green-600',
  'bg-purple-50 text-purple-600',
  'bg-amber-50 text-amber-600',
  'bg-pink-50 text-pink-600',
  'bg-cyan-50 text-cyan-600',
  'bg-indigo-50 text-indigo-600',
];

export function SpecialtyCard({ specialty, index = 0 }) {
  const colorClass = colorClasses[index % colorClasses.length];
  return (
    <Link
      to={`/chuyen-khoa/${specialty.slug}`}
      className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5 group"
    >
      <div className={`w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center mb-3`}>
        {iconMap[specialty.icon] || <Stethoscope className="w-6 h-6" />}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
        {specialty.name}
      </h3>
      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{specialty.description}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{specialty.doctorCount} bác sĩ</span>
        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
      </div>
    </Link>
  );
}
