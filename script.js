// Configuration des catégories et priorités
const CATEGORIES = {
    support: { icon: '🔧', label: 'Support IT' },
    projet: { icon: '📊', label: 'Projets' },
    reunion: { icon: '👥', label: 'Réunions' }
};

const PRIORITIES = {
    urgent: { label: 'Urgent', color: '#dc3545', icon: '⚡' },
    normal: { label: 'Normal', color: '#ffc107', icon: '⚪' },
    basse: { label: 'Basse', color: '#28a745', icon: '⭐' }
};

// Tâches d'exemple par défaut
const DEFAULT_TASKS = [
    {
        id: 'example1',
        text: 'Coupure réseau Lyon',
        category: 'support',
        priority: 'urgent',
        completed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'example2',
        text: 'Prépa budget 2024',
        category: 'projet',
        priority: 'normal',
        completed: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'example3',
        text: 'Réunion équipe',
        category: 'reunion',
        priority: 'basse',
        completed: false,
        createdAt: new Date().toISOString()
    }
];

// Fonction pour générer un ID unique
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Fonction pour formater la date
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Fonction pour formater le temps restant en format robotique
function formatTimeRobot(timeDiff) {
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    if (days > 0) {
        return `T-${days}j ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `T-${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fonction pour vérifier les échéances
function checkDeadlines() {
    const now = new Date();
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    
    tasks.forEach(task => {
        if (task.deadline) {
            const deadline = new Date(task.deadline);
            const timeDiff = deadline - now;
            const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
            const minutesRemaining = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
            
            switch (task.priority) {
                case 'urgent':
                    // Pour les tâches urgentes : compteur robotique dès 48h avant
                    if (hoursRemaining <= 48 && hoursRemaining > 0) {
                        // Mise à jour du compteur toutes les minutes
                        if (!task.lastCounterUpdate || (now - new Date(task.lastCounterUpdate)) >= 60000) {
                            showNotification(
                                `🤖 COUNTDOWN: "${task.text}" ${formatTimeRobot(timeDiff)}`,
                                'countdown'
                            );
                            task.lastCounterUpdate = now.toISOString();
                        }
                    }
                    break;
                    
                case 'normal':
                    // Pour les tâches normales : notification uniquement à 24h
                    if (hoursRemaining <= 24 && hoursRemaining > 23 && !task.notified24h) {
                        showNotification(`⚠️ Deadline dans 24h : "${task.text}"`);
                        task.notified24h = true;
                    }
                    break;
                    
                case 'basse':
                    // Pour les tâches basse priorité : notification uniquement à 12h
                    if (hoursRemaining <= 12 && hoursRemaining > 11 && !task.notified12h) {
                        showNotification(`⚠️ Deadline dans 12h : "${task.text}"`);
                        task.notified12h = true;
                    }
                    break;
            }
            
            // Notification à l'échéance pour toutes les tâches
            if (hoursRemaining <= 0 && !task.notifiedExpired) {
                showNotification(`🚨 Deadline dépassée : "${task.text}"`);
                task.notifiedExpired = true;
            }
        }
    });
    
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Fonction pour afficher une notification
function showNotification(message, type = 'normal') {
    if (!document.getElementById('enableNotification').checked) return;
    
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    
    // Style spécial pour le compteur robotique
    if (type === 'countdown') {
        notification.style.fontFamily = 'monospace';
        messageElement.style.letterSpacing = '2px';
        // La notification du compteur disparaît plus vite
        setTimeout(() => {
            notification.classList.remove('show');
        }, 2000);
    } else {
        notification.style.fontFamily = '';
        messageElement.style.letterSpacing = '';
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    notification.classList.add('show');
}

// Gestionnaire pour fermer la notification
document.getElementById('closeNotification').addEventListener('click', () => {
    document.getElementById('notification').classList.remove('show');
});

// Fonction pour formater la deadline
function formatDeadline(dateString) {
    const deadline = new Date(dateString);
    const now = new Date();
    const timeDiff = deadline - now;
    const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
    
    if (hoursRemaining < 0) {
        return `<span class="task-deadline urgent"><i class="fas fa-exclamation-circle"></i> Échéance dépassée</span>`;
    } else if (hoursRemaining <= 24) {
        return `<span class="task-deadline urgent"><i class="fas fa-clock"></i> Échéance dans ${hoursRemaining}h</span>`;
    } else {
        return `<span class="task-deadline"><i class="far fa-calendar-alt"></i> ${formatDate(dateString)}</span>`;
    }
}

// Gestionnaire d'événements principal
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initialisation de l\'application...');
    initializeFilters();
    initializePriorityButtons();
    loadTasks();
    checkDeadlines();
    
    document.getElementById('taskForm').addEventListener('submit', handleSubmit);
    document.getElementById('taskList').addEventListener('click', handleTaskClick);
});

// Initialisation des filtres
function initializeFilters() {
    console.log('Initialisation des filtres...');
    const filterContainer = document.createElement('div');
    filterContainer.className = 'filters-container';
    
    // Filtres de catégorie
    const categoryFilter = document.createElement('select');
    categoryFilter.id = 'categoryFilter';
    categoryFilter.innerHTML = `
        <option value="">Toutes les catégories</option>
        ${Object.entries(CATEGORIES).map(([value, { label }]) => 
            `<option value="${value}">${label}</option>`
        ).join('')}
    `;

    // Filtres de priorité
    const priorityFilter = document.createElement('select');
    priorityFilter.id = 'priorityFilter';
    priorityFilter.innerHTML = `
        <option value="">Toutes les priorités</option>
        ${Object.entries(PRIORITIES).map(([value, { label }]) => 
            `<option value="${value}">${label}</option>`
        ).join('')}
    `;

    filterContainer.appendChild(categoryFilter);
    filterContainer.appendChild(priorityFilter);

    const form = document.getElementById('taskForm');
    form.parentNode.insertBefore(filterContainer, form.nextSibling);

    categoryFilter.addEventListener('change', applyFilters);
    priorityFilter.addEventListener('change', applyFilters);
}

// Application des filtres
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    document.querySelectorAll('.task-item').forEach(task => {
        const categoryMatch = !categoryFilter || task.dataset.category === categoryFilter;
        const priorityMatch = !priorityFilter || task.dataset.priority === priorityFilter;
        
        task.style.display = categoryMatch && priorityMatch ? '' : 'none';
    });
}

// Initialisation des boutons de priorité
function initializePriorityButtons() {
    console.log('Initialisation des boutons de priorité...');
    const priorityButtons = document.querySelectorAll('.priority-button');
    const deadlineInput = document.getElementById('taskDeadline').parentElement;
    const countdownContainer = document.getElementById('countdownContainer');
    
    priorityButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            priorityButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');

            // Afficher/masquer le sélecteur de durée pour les tâches urgentes
            if (button.dataset.priority === 'urgent') {
                deadlineInput.style.display = 'none';
                countdownContainer.style.display = 'flex';
            } else {
                deadlineInput.style.display = 'flex';
                countdownContainer.style.display = 'none';
            }
        });
    });

    // S'assurer qu'un bouton est sélectionné par défaut
    const defaultButton = document.querySelector('.priority-button.normal') || priorityButtons[0];
    if (defaultButton) {
        defaultButton.classList.add('selected');
        deadlineInput.style.display = 'flex';
        countdownContainer.style.display = 'none';
    }
}

// Gestionnaire de soumission du formulaire
function handleSubmit(event) {
    event.preventDefault();
    
    const taskInput = document.getElementById('taskInput');
    const categorySelect = document.getElementById('taskCategory');
    const selectedPriorityButton = document.querySelector('.priority-button.selected');
    const deadlineInput = document.getElementById('taskDeadline');
    const countdownHours = document.getElementById('countdownHours');
    
    if (!taskInput || !categorySelect || !selectedPriorityButton) {
        console.error('Éléments du formulaire manquants');
        return;
    }

    const taskText = taskInput.value.trim();
    const taskCategory = categorySelect.value;
    const taskPriority = selectedPriorityButton.dataset.priority;
    
    let taskDeadline;
    if (taskPriority === 'urgent') {
        // Pour les tâches urgentes, calculer la deadline à partir des heures sélectionnées
        const hours = parseInt(countdownHours.value) || 1;
        taskDeadline = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    } else {
        taskDeadline = deadlineInput.value || null;
    }

    if (taskText && taskCategory) {
        console.log('Ajout d\'une nouvelle tâche:', {
            text: taskText,
            category: taskCategory,
            priority: taskPriority,
            deadline: taskDeadline
        });
        
        addTask(taskText, taskCategory, taskPriority, taskDeadline);
        
        // Réinitialiser le formulaire
        taskInput.value = '';
        categorySelect.value = '';
        deadlineInput.value = '';
        countdownHours.value = '1';
        
        // Réinitialiser la priorité à "normal"
        document.querySelectorAll('.priority-button').forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.priority === 'normal') {
                btn.classList.add('selected');
                deadlineInput.style.display = 'flex';
                countdownContainer.style.display = 'none';
            }
        });
    }
}

// Fonction pour créer l'élément DOM d'une tâche
function createTaskElement(task) {
    console.log('Création de l\'élément tâche:', task);
    
    // Vérification et correction des valeurs par défaut
    task.category = task.category || 'projet';
    task.priority = task.priority || 'normal';
    task.createdAt = task.createdAt || new Date().toISOString();
    
    // Vérification que la catégorie existe
    if (!CATEGORIES[task.category]) {
        console.warn(`Catégorie "${task.category}" non trouvée, utilisation de "projet" par défaut`);
        task.category = 'projet';
    }
    
    // Vérification que la priorité existe
    if (!PRIORITIES[task.priority]) {
        console.warn(`Priorité "${task.priority}" non trouvée, utilisation de "normal" par défaut`);
        task.priority = 'normal';
    }

    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id || generateId();
    li.dataset.category = task.category;
    li.dataset.priority = task.priority;
    
    const content = document.createElement('div');
    content.className = 'task-content';

    // Badge de priorité en premier
    const priorityBadge = document.createElement('span');
    priorityBadge.className = `priority-badge priority-${task.priority}`;
    priorityBadge.textContent = PRIORITIES[task.priority].label;
    priorityBadge.style.backgroundColor = PRIORITIES[task.priority].color;

    // Badge de catégorie
    const categoryBadge = document.createElement('span');
    categoryBadge.className = `category-badge category-${task.category}`;
    categoryBadge.innerHTML = `${CATEGORIES[task.category].icon} ${CATEGORIES[task.category].label}`;

    // Texte de la tâche
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text || 'Nouvelle tâche';

    // Date de création et deadline
    const dateInfo = document.createElement('div');
    dateInfo.className = 'date-info';
    
    const creationDate = document.createElement('span');
    creationDate.className = 'task-date';
    creationDate.innerHTML = `<i class="far fa-clock"></i> ${formatDate(task.createdAt)}`;
    
    dateInfo.appendChild(creationDate);
    
    if (task.deadline) {
        const deadlineElement = document.createElement('div');
        deadlineElement.className = 'task-deadline';
        
        if (task.priority === 'urgent') {
            // Créer le compteur pour les tâches urgentes
            const countdownElement = document.createElement('div');
            countdownElement.className = 'countdown-display';
            countdownElement.dataset.deadline = task.deadline;
            countdownElement.innerHTML = `<span class="countdown-label">DEADLINE</span><span class="countdown-time"></span>`;
            deadlineElement.appendChild(countdownElement);
        } else if (task.priority === 'normal') {
            // Pour les tâches normales, afficher uniquement quand il reste moins de 24h
            const deadline = new Date(task.deadline);
            const now = new Date();
            const timeDiff = deadline - now;
            const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
            
            if (hoursRemaining <= 24) {
                const countdownElement = document.createElement('div');
                countdownElement.className = 'countdown-display normal';
                countdownElement.dataset.deadline = task.deadline;
                countdownElement.innerHTML = `<span class="countdown-time"></span>`;
                deadlineElement.appendChild(countdownElement);
            } else {
                deadlineElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(task.deadline)}`;
            }
        } else {
            // Pour les tâches basse priorité, afficher uniquement quand il reste moins de 12h
            const deadline = new Date(task.deadline);
            const now = new Date();
            const timeDiff = deadline - now;
            const hoursRemaining = Math.floor(timeDiff / (1000 * 60 * 60));
            
            if (hoursRemaining <= 12) {
                const countdownElement = document.createElement('div');
                countdownElement.className = 'countdown-display basse';
                countdownElement.dataset.deadline = task.deadline;
                countdownElement.innerHTML = `<span class="countdown-time"></span>`;
                deadlineElement.appendChild(countdownElement);
            } else {
                deadlineElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(task.deadline)}`;
            }
        }
        
        dateInfo.appendChild(deadlineElement);
    }

    // Bouton de suppression
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '×';
    deleteBtn.className = 'delete-btn';

    // Modification de l'assemblage des éléments
    const taskInfo = document.createElement('div');
    taskInfo.className = 'task-info';
    taskInfo.appendChild(taskText);
    taskInfo.appendChild(dateInfo);

    content.appendChild(priorityBadge);
    content.appendChild(categoryBadge);
    content.appendChild(taskInfo);
    li.appendChild(content);
    li.appendChild(deleteBtn);

    return li;
}

// Fonction pour ajouter une nouvelle tâche
function addTask(taskText, category, priority, deadline) {
    const task = {
        id: generateId(),
        text: taskText,
        category: category,
        priority: priority,
        completed: false,
        createdAt: new Date().toISOString(),
        deadline: deadline,
        lastCounterUpdate: null,
        notified24h: false,
        notified12h: false,
        notifiedExpired: false
    };

    const li = createTaskElement(task);
    document.getElementById('taskList').appendChild(li);
    saveTasks();
}

// Gestionnaire de clics sur les tâches
function handleTaskClick(event) {
    const target = event.target;
    if (target.classList.contains('delete-btn')) {
        const taskItem = target.closest('.task-item');
        if (taskItem) {
            console.log('Suppression de la tâche:', taskItem.dataset.id);
            deleteTask(taskItem);
        }
    }
}

// Fonction pour supprimer une tâche
function deleteTask(taskElement) {
    taskElement.remove();
    saveTasks();
}

// Fonction pour sauvegarder les tâches
function saveTasks() {
    const taskList = document.getElementById('taskList');
    const tasks = [];

    taskList.querySelectorAll('.task-item').forEach(task => {
        tasks.push({
            id: task.dataset.id,
            text: task.querySelector('.task-text').textContent,
            category: task.dataset.category,
            priority: task.dataset.priority,
            completed: false,
            createdAt: new Date().toISOString()
        });
    });

    console.log('Sauvegarde des tâches:', tasks);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Fonction pour charger les tâches
function loadTasks() {
    console.log('Chargement des tâches...');
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';

    try {
        const savedTasks = localStorage.getItem('tasks');
        let tasks = [];

        if (savedTasks) {
            try {
                tasks = JSON.parse(savedTasks);
                console.log('Tâches chargées depuis le localStorage:', tasks);
            } catch (e) {
                console.error('Erreur lors du parsing des tâches:', e);
                tasks = [];
            }
        }

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            console.log('Aucune tâche trouvée, chargement des tâches par défaut');
            tasks = DEFAULT_TASKS;
        }

        tasks.forEach(task => {
            try {
                const li = createTaskElement(task);
                taskList.appendChild(li);
            } catch (e) {
                console.error('Erreur lors de la création de la tâche:', task, e);
            }
        });

        saveTasks();
    } catch (error) {
        console.error('Erreur lors du chargement des tâches:', error);
        DEFAULT_TASKS.forEach(task => {
            const li = createTaskElement(task);
            taskList.appendChild(li);
        });
        saveTasks();
    }
}

// Vérifier les échéances plus fréquemment (toutes les 30 secondes)
setInterval(checkDeadlines, 30000);

// Fonction pour mettre à jour tous les compteurs
function updateCountdowns() {
    document.querySelectorAll('.countdown-display').forEach(countdown => {
        const deadline = new Date(countdown.dataset.deadline);
        const now = new Date();
        const timeDiff = deadline - now;
        
        if (timeDiff <= 0) {
            countdown.innerHTML = '<span class="countdown-expired">DEADLINE DÉPASSÉE</span>';
        } else {
            const timeDisplay = formatTimeRobot(timeDiff);
            countdown.querySelector('.countdown-time').textContent = timeDisplay;
        }
    });
}

// Mettre à jour les compteurs chaque seconde
setInterval(updateCountdowns, 1000);

