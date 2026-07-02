'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import {
  getDepartmentsForBatch,
  Subject,
  SubjectCategory,
  CATEGORY_ORDER,
  CATEGORY_META,
} from '@/frontend/utils/departments';
import { SubjectList } from '@/frontend/components/SubjectList';

interface DepartmentPageProps {
  params: { department: string };
}

const BATCH_YEARS = Array.from(
  { length: new Date().getFullYear() - 2019 + 1 },
  (_, i) => new Date().getFullYear() - i
);

export default function DepartmentPage({ params }: DepartmentPageProps) {
  const departmentId = params.department.toLowerCase();

  const [batchYear, setBatchYear] = useState<number>(2023);
  const [paperCounts, setPaperCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory | 'All'>('All');
  const [favourites, setFavourites] = useState<string[]>([]);
  const [showFavouritesOnly, setShowFavouritesOnly] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const deptList = getDepartmentsForBatch(batchYear);
  const dept = deptList.find((d) => d.id.toLowerCase() === departmentId);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((data) => { if (data.paperCounts) setPaperCounts(data.paperCounts); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('favorite_subjects');
      if (stored) setFavourites(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (dept) {
      try {
        const recent = localStorage.getItem('recent_departments');
        let ids: string[] = recent ? JSON.parse(recent) : [];
        ids = [dept.id, ...ids.filter((id) => id !== dept.id)].slice(0, 4);
        localStorage.setItem('recent_departments', JSON.stringify(ids));
      } catch {}
    }
  }, [dept]);

  if (!dept) {
    return (
      <div className="container page-top section" style={{ textAlign: 'center' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', margin: '0 auto 24px' }}>
            <Icons.AlertCircle size={28} />
          </div>
          <h2 style={{ marginBottom: 12 }}>Department Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
            The department &quot;{params.department}&quot; does not exist.
          </p>
          <Link href="/departments" className="btn btn-primary">
            <Icons.ArrowLeft size={14} /> Back to Departments
          </Link>
        </div>
      </div>
    );
  }

  const IconComponent = (Icons as any)[dept.icon] || Icons.GraduationCap;

  const toggleFavourite = (code: string) => {
    try {
      const next = favourites.includes(code)
        ? favourites.filter((c) => c !== code)
        : [...favourites, code];
      setFavourites(next);
      localStorage.setItem('favorite_subjects', JSON.stringify(next));
    } catch {}
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Filter subjects
  const filteredSubjects = dept.subjects.filter((s) => {
    const matchesSearch =
      !searchQuery ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'All' || s.category === selectedCategory;
    const matchesFav = !showFavouritesOnly || favourites.includes(s.code);
    return matchesSearch && matchesCat && matchesFav;
  });

  // Group by category in defined order
  const grouped: Partial<Record<SubjectCategory, Subject[]>> = {};
  CATEGORY_ORDER.forEach((cat) => {
    const items = filteredSubjects.filter((s) => s.category === cat);
    if (items.length > 0) grouped[cat] = items;
  });

  // Categories that actually exist in this department (for filter pills)
  const availableCategories = CATEGORY_ORDER.filter((cat) =>
    dept.subjects.some((s) => s.category === cat)
  );

  return (
    <div className="container page-top section-sm">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0E9300')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>Home</Link>
        <Icons.ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <Link href="/departments" style={{ color: 'var(--text-secondary)' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#0E9300')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}>Departments</Link>
        <Icons.ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: '#0E9300', fontWeight: 600 }}>{dept.name.replace('Computer Science and Engineering', 'CSE')}</span>
      </nav>

      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, background: 'linear-gradient(145deg, rgba(14,147,0,0.05) 0%, rgba(7,11,24,0.4) 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, marginBottom: 40, backdropFilter: 'blur(12px)', flexWrap: 'wrap' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(14,147,0,0.15)', border: '1px solid rgba(14,147,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E9300', flexShrink: 0 }}>
          <IconComponent size={26} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1 style={{ fontSize: 'clamp(1.2rem, 3vw, 1.75rem)', fontWeight: 800, marginBottom: 6 }}>{dept.name}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{dept.description}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          {/* Batch year picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Batch:</span>
            <select
              value={batchYear}
              onChange={(e) => { setBatchYear(Number(e.target.value)); setSelectedCategory('All'); setSearchQuery(''); }}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '4px 10px', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              {BATCH_YEARS.map((y) => (
                <option key={y} value={y}>Batch {y}</option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {filteredSubjects.length} of {dept.subjects.length} subjects
          </div>
        </div>
      </div>

      {/* Search + Favourites row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Icons.Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search subject code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: 40, paddingRight: 40, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', height: 42, fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = '#0E9300')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <Icons.X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFavouritesOnly(!showFavouritesOnly)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', height: 42, borderRadius: 'var(--radius-md)', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: showFavouritesOnly ? 'rgba(14,147,0,0.15)' : 'rgba(255,255,255,0.02)', color: showFavouritesOnly ? '#0E9300' : 'var(--text-secondary)', border: `1px solid ${showFavouritesOnly ? '#0E9300' : 'var(--border)'}` }}
        >
          <Icons.Star size={15} fill={showFavouritesOnly ? '#0E9300' : 'none'} />
          Favourites Only
        </button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
        <button
          onClick={() => setSelectedCategory('All')}
          style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: selectedCategory === 'All' ? '#0E9300' : 'rgba(255,255,255,0.03)', color: selectedCategory === 'All' ? '#fff' : 'var(--text-secondary)', border: `1px solid ${selectedCategory === 'All' ? '#0E9300' : 'var(--border)'}` }}
        >
          All Subjects
        </button>
        {availableCategories.map((cat) => {
          const meta = CATEGORY_META[cat];
          const IconC = (Icons as any)[meta.icon] || Icons.BookOpen;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', background: isActive ? meta.color : 'rgba(255,255,255,0.03)', color: isActive ? '#000' : 'var(--text-secondary)', border: `1px solid ${isActive ? meta.color : 'var(--border)'}` }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.color = meta.color; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
            >
              <IconC size={12} />
              {cat}
            </button>
          );
        })}
      </div>

      {/* Subjects grouped by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
        {Object.keys(grouped).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
            No subjects match your current filters.
          </div>
        ) : (
          (Object.entries(grouped) as [SubjectCategory, Subject[]][]).map(([cat, subjects]) => {
            const meta = CATEGORY_META[cat];
            const IconC = (Icons as any)[meta.icon] || Icons.BookOpen;
            const isCollapsed = !!collapsedCategories[cat];

            return (
              <div key={cat} style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                {/* Accordion header */}
                <button
                  onClick={() => toggleCategory(cat)}
                  style={{ width: '100%', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: 'none', borderBottom: isCollapsed ? 'none' : '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none', textAlign: 'left', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${meta.color}18`, border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <IconC size={14} style={{ color: meta.color }} />
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{cat}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 6 }}>
                      {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'}
                    </span>
                  </div>
                  {isCollapsed ? <Icons.ChevronDown size={17} /> : <Icons.ChevronUp size={17} />}
                </button>

                {/* Accordion content */}
                {!isCollapsed && (
                  <div style={{ padding: 20 }}>
                    <SubjectList
                      subjects={subjects}
                      favourites={favourites}
                      onToggleFavourite={toggleFavourite}
                      paperCounts={paperCounts}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
