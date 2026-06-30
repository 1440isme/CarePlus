import { useState } from 'react';
import { Search } from 'lucide-react';
import { SpecialtyCard } from '../../shared/components/shared/SpecialtyCard';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import { useSpecialties } from '../../features/specialty/hooks/useSpecialties';

export default function SpecialtyListPage() {
  const [q, setQ] = useState('');
  const { data: specialtiesData, isLoading } = useSpecialties({});

  const specialties = specialtiesData?.data || [];

  const filtered = specialties.filter(s =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    s.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Khám chuyên khoa</h1>
        <p className="text-gray-500">Đội ngũ chuyên gia trong {specialties.length} chuyên khoa y tế</p>
      </div>

      <div className="relative max-w-md mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Tìm chuyên khoa..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {isLoading ? (
        <LoadingBlock label="Đang tải danh sách chuyên khoa..." />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p>Không tìm thấy chuyên khoa phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((s, i) => (
            <SpecialtyCard key={s.id} specialty={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
