import { Link } from "react-router-dom";
import { teacherClassSummaries, teacherStudents } from "../../data/mockData";
import { fetchTeacherDashboard } from "../../services/teacher";
import { useAppState } from "../../state/AppState";
import { useApiResource } from "../../utils/useApiResource";

const fallbackDashboard = {
  classSummaries: teacherClassSummaries,
  students: teacherStudents,
};

export function TeacherDashboardPage() {
  const { state } = useAppState();
  const canUseApi = state.authSource === "api" && Boolean(state.authToken);
  const { data, error, isLoading, source } = useApiResource({
    enabled: canUseApi,
    fallbackData: fallbackDashboard,
    fetcher: () => fetchTeacherDashboard(state.authToken ?? ""),
    dependencies: [state.authToken],
  });

  const completedAll = data.students.filter((student) => student.completedLevels === 3).length;
  const examCompleted = data.students.filter((student) => student.score !== null).length;
  const attentionStudents = data.students.filter((student) => student.completedLevels < 3);

  return (
    <div className="page-stack">
      <section className="hero-banner hero-banner--teacher">
        <div>
          <span className="hero-banner__eyebrow">教师首页</span>
          <h1>班级学习总览与近期关注提醒</h1>
          <p>优先展示班级总进度、三关完成率、考试完成率和需要马上跟进的学生。</p>
        </div>
        <div className="hero-banner__actions">
          <Link className="primary-button link-button" to="/teacher/students">
            查看学生列表
          </Link>
          <Link className="ghost-button link-button" to="/teacher/classes">
            查看班级概览
          </Link>
        </div>
      </section>

      <article className="feedback-box">
        <strong>{source === "api" ? "当前使用后端教师数据" : "当前使用本地演示数据"}</strong>
        <p>
          {isLoading
            ? "正在同步教师端数据..."
            : error || "教师首页已经具备真实接口读取位，后端就绪后会自动切换。"}
        </p>
      </article>

      <section className="card-grid card-grid--three">
        <article className="surface-card stat-card">
          <span>班级人数</span>
          <strong>{data.students.length}</strong>
          <p>当前默认聚焦道路安全主题学习，便于教师快速查看整体推进情况。</p>
        </article>
        <article className="surface-card stat-card">
          <span>三关全部完成</span>
          <strong>{completedAll}</strong>
          <p>可以快速判断班级是否已经完成主题学习的主链路。</p>
        </article>
        <article className="surface-card stat-card">
          <span>考试完成</span>
          <strong>{examCompleted}</strong>
          <p>便于课后查看知识巩固情况和错题分布。</p>
        </article>
      </section>

      <section className="card-grid card-grid--two">
        <article className="surface-card">
          <span className="section-block__eyebrow">班级完成概览</span>
          <h2>先看哪一个班级需要更多课堂支持</h2>
          <div className="bar-list">
            {data.classSummaries.map((classroom) => (
              <article key={classroom.id} className="bar-item">
                <div className="row-between">
                  <strong>{classroom.name}</strong>
                  <span>{classroom.completedRate}%</span>
                </div>
                <div className="bar-item__track">
                  <span
                    className="bar-item__fill"
                    style={{ width: `${classroom.completedRate}%` }}
                  />
                </div>
                <p>{classroom.focusLabel}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="surface-card">
          <span className="section-block__eyebrow">近期异常提醒</span>
          <h2>这些学生值得优先查看</h2>
          <div className="page-stack">
            {attentionStudents.map((student) => (
              <article key={student.id} className="teacher-alert-card">
                <div className="row-between">
                  <div>
                    <strong>{student.name}</strong>
                    <p>{student.className}</p>
                  </div>
                  <Link className="ghost-button link-button" to={`/teacher/students/${student.id}`}>
                    学生详情
                  </Link>
                </div>
                <p>{student.weakSpot}</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
