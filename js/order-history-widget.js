(function () {
  let basePath = '';
  const ICON_WRAPPER_ID = 'orderHistoryIconWrapper';
  const BADGE_ID = 'orderHistoryBadge';
  const MODAL_ID = 'orderHistoryModal';
  const MODAL_BODY_ID = 'orderHistoryModalBody';
  const MODAL_TITLE_ID = 'orderHistoryModalLabel';

  function parseJSONFromStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`Không thể đọc dữ liệu từ localStorage.${key}`, error);
      return fallback;
    }
  }

  function getCurrentUserIdentifier() {
    const currentUser = parseJSONFromStorage('currentUser', null);
    if (!currentUser) return null;
    return (
      currentUser.username ||
      currentUser.email ||
      currentUser.phone ||
      null
    );
  }

  function formatCurrency(value) {
    const number = Number(value) || 0;
    return number.toLocaleString('vi-VN');
  }

  function getStatusText(status) {
    const map = {
      'chua-xu-ly': 'Chưa xử lý',
      'dang-giao': 'Đang giao',
      'hoan-thanh': 'Hoàn thành',
      'da-huy': 'Đã hủy'
    };
    return map[status] || 'Chưa xác định';
  }

  function getStatusClass(status) {
    const map = {
      'chua-xu-ly': 'bg-warning text-dark',
      'dang-giao': 'bg-info text-dark',
      'hoan-thanh': 'bg-success',
      'da-huy': 'bg-danger'
    };
    return `badge ${map[status] || 'bg-secondary'}`;
  }

  function getPaymentMethodLabel(method) {
    if (method === 'card') return 'Thanh toán bằng thẻ';
    if (method === 'cash') return 'Tiền mặt (COD)';
    return 'Chưa cung cấp';
  }

  function resolvePath(relativePath) {
    if (!relativePath) return basePath || '';
    return `${basePath || ''}${relativePath}`;
  }

  function ensureTriggerExists(userSection) {
    let wrapper = document.getElementById(ICON_WRAPPER_ID);
    if (wrapper) return wrapper;
    if (!userSection) return null;

    wrapper = document.createElement('div');
    wrapper.id = ICON_WRAPPER_ID;
    wrapper.className = 'ms-2';
    wrapper.innerHTML = `
      <button type="button"
        class="btn btn-outline-success btn-sm rounded-circle position-relative text-success shadow-sm"
        data-bs-toggle="modal"
        data-bs-target="#${MODAL_ID}"
        aria-label="Xem lịch sử đơn hàng"
        title="Lịch sử đơn hàng">
        <i class="fa fa-receipt"></i>
        <span id="${BADGE_ID}" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>
      </button>
    `;

    userSection.insertAdjacentElement('beforebegin', wrapper);
    return wrapper;
  }

  function ensureModalExists() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = MODAL_ID;
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', MODAL_TITLE_ID);
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="${MODAL_TITLE_ID}">
              <i class="fa fa-receipt me-2"></i>Lịch sử đơn hàng
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="${MODAL_BODY_ID}">
            <div class="text-center text-muted py-3">
              <div class="spinner-border text-success" role="status"></div>
              <p class="mt-2 mb-0">Đang tải...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function buildOrderCard(order, index) {
    const orderId = order.id || `#${index + 1}`;
    const totalAmount = order.totals?.total || order.total || 0;
    const paymentLabel = order.payment?.label || getPaymentMethodLabel(order.payment?.method);
    const orderDate = order.date ? new Date(order.date).toLocaleString('vi-VN') : 'Chưa xác định';
    const itemCount = (order.items || []).reduce((sum, item) => sum + (item?.qty || 0), 0);

    return `
      <div class="border rounded p-3 mb-3 shadow-sm">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="fw-bold text-primary">
            <i class="fa fa-file-invoice me-2"></i>${orderId}
          </div>
          <span class="${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
        </div>
        <p class="mb-1 small text-muted">
          <i class="fa fa-calendar me-2"></i>${orderDate}
        </p>
        <p class="mb-1 small">
          <i class="fa fa-box me-2"></i>${itemCount} sản phẩm
        </p>
        <p class="mb-1 small">
          <i class="fa fa-credit-card me-2"></i>${paymentLabel}
        </p>
        <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
          <span class="small text-muted">Tổng tiền</span>
          <span class="fw-bold text-success">${formatCurrency(totalAmount)}₫</span>
        </div>
      </div>
    `;
  }

  function renderOrderHistory() {
    const badge = document.getElementById(BADGE_ID);
    const modalBody = document.getElementById(MODAL_BODY_ID);
    const triggerWrapper = document.getElementById(ICON_WRAPPER_ID);

    if (!modalBody || !triggerWrapper) return;

    const userIdentifier = getCurrentUserIdentifier();

    if (!userIdentifier) {
      modalBody.innerHTML = `
        <div class="alert alert-warning mb-0">
          <i class="fa fa-info-circle me-2"></i>
          Vui lòng <a href="${resolvePath('user/login.html')}" class="alert-link">đăng nhập</a> để xem lịch sử đơn hàng.
        </div>
      `;
      if (badge) {
        badge.classList.add('d-none');
        badge.textContent = '0';
      }
      return;
    }

    const orders = parseJSONFromStorage('orders', []);
    const userOrders = Array.isArray(orders)
      ? orders.filter(order => {
          const orderUsername =
            order.username ||
            order.customer?.email ||
            order.customer?.phone;
          return orderUsername === userIdentifier;
        })
      : [];

    if (badge) {
      if (userOrders.length) {
        badge.classList.remove('d-none');
        badge.textContent = userOrders.length > 99 ? '99+' : String(userOrders.length);
      } else {
        badge.classList.add('d-none');
        badge.textContent = '0';
      }
    }

    if (!userOrders.length) {
      modalBody.innerHTML = `
        <div class="alert alert-info mb-3">
          <i class="fa fa-info-circle me-2"></i>
          Bạn chưa có đơn hàng nào. Hãy <a href="${resolvePath('product.html')}" class="alert-link">mua sắm ngay</a>!
        </div>
      `;
      return;
    }

    modalBody.innerHTML = userOrders
      .slice()
      .reverse()
      .map(buildOrderCard)
      .join('');
  }

  document.addEventListener('DOMContentLoaded', () => {
    const userSection = document.getElementById('userSection');
    if (!userSection) return;

    basePath = typeof userSection.dataset.basePath === 'string'
      ? userSection.dataset.basePath
      : '';
    if (!basePath) {
      basePath = window.location.pathname.includes('/user/') ? '../' : '';
    }
    if (basePath && !basePath.endsWith('/')) {
      basePath += '/';
    }

    const trigger = ensureTriggerExists(userSection);
    const modal = ensureModalExists();

    if (!trigger || !modal) return;

    renderOrderHistory();

    modal.addEventListener('show.bs.modal', renderOrderHistory);
    window.refreshOrderHistoryWidget = renderOrderHistory;
  });
})();
