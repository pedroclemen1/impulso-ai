import { ArrowRight, Award, CalendarClock, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DifficultyBadge, EnrollmentStatusBadge } from '@/components/common/Badges';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { coverClass, formatDate } from '@/lib/utils';
import type { DashboardCourse } from '@/types/student';

export function CourseCard({ course }: { course: DashboardCourse }) {
  const cta =
    course.status === 'COMPLETED'
      ? { label: 'Revisar curso', to: `/app/courses/${course.courseId}` }
      : course.next
        ? { label: course.status === 'NOT_STARTED' ? 'Começar' : 'Continuar', to: course.next.path }
        : { label: 'Abrir curso', to: `/app/courses/${course.courseId}` };
  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <Link to={`/app/courses/${course.courseId}`} className={`relative block h-24 bg-gradient-to-br ${coverClass(course.coverColor)}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
          <span className="rounded-full bg-white/95 shadow-sm">
            <EnrollmentStatusBadge status={course.status} />
          </span>
          {course.certificateCode && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Award className="h-3 w-3" /> Certificado
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <Link to={`/app/courses/${course.courseId}`} className="line-clamp-2 font-semibold leading-snug hover:text-primary">
            {course.title}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <DifficultyBadge difficulty={course.difficulty} />
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {course.estimatedHours}h
            </span>
            {course.dueDate && course.status !== 'COMPLETED' && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> até {formatDate(course.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {course.lessonsDone} de {course.totalLessons} aulas
            </span>
            <span className="font-medium">{Math.round(course.progressPercent)}%</span>
          </div>
          <Progress value={course.progressPercent} />
        </div>
        {course.next && course.status !== 'COMPLETED' && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            Próximo: <span className="font-medium text-foreground">{course.next.title}</span>
          </p>
        )}
        <Button asChild size="sm" variant={course.status === 'COMPLETED' ? 'outline' : 'default'} className="mt-auto">
          <Link to={cta.to}>
            {cta.label} <ArrowRight />
          </Link>
        </Button>
      </div>
    </Card>
  );
}
