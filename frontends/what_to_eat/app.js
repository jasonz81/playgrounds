// 初始化餐厅列表
let restaurants = [];

// 加载餐厅列表
function loadRestaurants() {
    fetch('restaurants.json')
        .then(response => response.json())
        .then(data => {
            restaurants = data.restaurants;
            updateRestaurantList();
        })
        .catch(error => {
            console.error('加载餐厅列表失败:', error);
            // 使用默认餐厅列表
            restaurants = [
                '肯德基',
                '麦当劳',
                '必胜客',
                '海底捞',
                '小龙坎',
                '呷哺呷哺',
                '真功夫',
                '永和大王'
            ];
            updateRestaurantList();
        });
}

// 更新餐厅列表显示
function updateRestaurantList() {
    const listContainer = document.getElementById('restaurantList');
    listContainer.innerHTML = '';
    restaurants.forEach((restaurant, index) => {
        const tag = document.createElement('span');
        tag.className = 'restaurant-tag';
        tag.textContent = restaurant;
        tag.dataset.index = index;
        listContainer.appendChild(tag);
    });
}

// 从餐厅列表中随机选择一个
function pickRestaurant() {
    if (restaurants.length === 0) {
        alert('请先添加餐厅！');
        return;
    }
    
    const pickBtn = document.getElementById('pickBtn');
    const result = document.getElementById('result');
    const listContainer = document.getElementById('restaurantList');
    
    // 禁用按钮
    pickBtn.disabled = true;
    pickBtn.classList.add('picking');
    
    // 清空结果
    result.textContent = '';
    result.classList.remove('show', 'scrolling');
    
    // 开始滚动动画
    const scrollCount = Math.floor(Math.random() * 10) + 10; // 滚动10-20次
    let currentIndex = 0;
    let scrollIteration = 0;
    
    const scrollInterval = setInterval(() => {
        // 移除所有选中状态
        document.querySelectorAll('.restaurant-tag').forEach(tag => {
            tag.classList.remove('selected');
        });
        
        // 随机选择一个标签高亮
        const randomIndex = Math.floor(Math.random() * restaurants.length);
        const selectedTag = document.querySelectorAll('.restaurant-tag')[randomIndex];
        if (selectedTag) {
            selectedTag.classList.add('selected');
        }
        
        scrollIteration++;
        
        // 减慢滚动速度
        if (scrollIteration === scrollCount) {
            clearInterval(scrollInterval);
            
            // 选择最终餐厅
            const finalIndex = Math.floor(Math.random() * restaurants.length);
            const finalRestaurant = restaurants[finalIndex];
            
            // 最终结果动画
            setTimeout(() => {
                result.textContent = finalRestaurant;
                result.classList.add('show');
                
                // 移除所有标签的选中状态，只保留最终选中的
                document.querySelectorAll('.restaurant-tag').forEach((tag, idx) => {
                    tag.classList.remove('selected');
                    if (idx === finalIndex) {
                        tag.classList.add('selected');
                    }
                });
                
                // 重新启用按钮
                pickBtn.disabled = false;
                pickBtn.classList.remove('picking');
            }, 300);
        }
    }, 100); // 每100ms更新一次
}

// 编辑餐厅列表
function showEditModal() {
    const modal = document.getElementById('editModal');
    const textarea = document.getElementById('restaurantTextarea');
    textarea.value = restaurants.join('\n');
    modal.style.display = 'block';
}

// 保存餐厅列表
function saveRestaurants() {
    const textarea = document.getElementById('restaurantTextarea');
    const newRestaurants = textarea.value
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.length > 0);
    
    if (newRestaurants.length === 0) {
        alert('至少需要一个餐厅！');
        return;
    }
    
    restaurants = newRestaurants;
    updateRestaurantList();
    
    // 保存到 localStorage
    localStorage.setItem('restaurants', JSON.stringify(restaurants));
    
    // 关闭模态框
    document.getElementById('editModal').style.display = 'none';
    
    // 清空选择结果
    document.getElementById('result').textContent = '';
}

// 从 localStorage 加载
function loadFromLocalStorage() {
    const saved = localStorage.getItem('restaurants');
    if (saved) {
        try {
            restaurants = JSON.parse(saved);
            updateRestaurantList();
            return true;
        } catch (e) {
            console.error('解析存储的餐厅列表失败:', e);
        }
    }
    return false;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 尝试从 localStorage 加载
    if (!loadFromLocalStorage()) {
        // 否则从文件加载
        loadRestaurants();
    }
    
    // 绑定事件
    document.getElementById('pickBtn').addEventListener('click', pickRestaurant);
    document.getElementById('editBtn').addEventListener('click', showEditModal);
    document.getElementById('saveBtn').addEventListener('click', saveRestaurants);
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('editModal').style.display = 'none';
    });
    
    // 点击模态框外部关闭
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
            document.getElementById('editModal').style.display = 'none';
        }
    });
});

