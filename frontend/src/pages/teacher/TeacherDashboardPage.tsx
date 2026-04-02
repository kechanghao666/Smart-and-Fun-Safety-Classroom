import { teacherStudents } from "../../data/mockData";

export function TeacherDashboardPage() {
  const completedAll = teacherStudents.filter((student) => student.completedLevels === 3).length;
  const examCompleted = teacherStudents.filter((student) => student.examStatus === "已完成考试").length;

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">教师首页</span>
          <h1>班级学习总览</h1>
          <p>优先展示班级总进度、三关完成率、考试完成率和需要关注的学生提醒。</p>
        </div>
      </section>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>班级人数</span>
          <strong>{teacherStudents.length}</strong>
          <p>当前示例班级：三年级（2）班</p>
        </article>
        <article className="surface-card stat-card">
          <span>三关全部完成</span>
          <strong>{completedAll}</strong>
          <p>可用于课堂任务完成情况跟踪。</p>
        </article>
        <article className="surface-card stat-card">
          <span>考试完成</span>
          <strong>{examCompleted}</strong>
          <p>便于课后巩固情况查看。</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">近期异常提醒</span>
          <h2>需要优先关注</h2>
          <ul className="plain-list">
            {teacherStudents
              .filter((student) => student.completedLevels < 3)
              .map((student) => (
                <li key={student.id}>
                  {student.name}：{student.weakSpot}
                </li>
              ))}
          </ul>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">班级总结</span>
          <h2>课堂后可直接查看的信息</h2>
          <ul className="plain-list">
            <li>哪些学生完成了三关</li>
            <li>哪些学生已解锁但尚未完成考试</li>
            <li>哪些主题薄弱点在班级中重复出现</li>
          </ul>
        </article>
      </section>
    </div>
  );
}

