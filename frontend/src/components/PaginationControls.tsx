interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  label?: string;
}

function clampPage(page: number, totalPages: number) {
  return Math.max(1, Math.min(totalPages, page));
}

function buildVisiblePages(page: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(1, Math.min(page - 1, totalPages - 4));
  return Array.from({ length: 5 }, (_, index) => start + index).filter(
    (value) => value <= totalPages,
  );
}

export function PaginationControls({
  page,
  totalPages,
  onPageChange,
  label,
}: PaginationControlsProps) {
  const safePage = clampPage(page, totalPages);
  const visiblePages = buildVisiblePages(safePage, totalPages);

  return (
    <nav className="pagination-bar" aria-label={label ?? "分页导航"}>
      <div className="pagination-bar__summary">
        <strong>{label ?? "分页"}</strong>
        <span>
          第 {safePage} / {totalPages} 页
        </span>
      </div>

      <div className="pagination-bar__actions">
        <button
          type="button"
          className="pagination-button"
          disabled={safePage === 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          上一页
        </button>

        <div className="pagination-bar__pages">
          {visiblePages.map((item) => (
            <button
              key={item}
              type="button"
              className={
                item === safePage
                  ? "pagination-button pagination-button--active"
                  : "pagination-button"
              }
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-button"
          disabled={safePage === totalPages}
          onClick={() => onPageChange(safePage + 1)}
        >
          下一页
        </button>
      </div>
    </nav>
  );
}
