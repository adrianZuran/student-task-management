
const form = document.getElementById("task-form");
const taskList = document.getElementById("task-list");
const taskId = document.getElementById("task-id");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");

async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");
        const data = await response.json();

        if (!response.ok) {
            taskList.innerHTML = `<p class="empty">${escapeHTML(data.error || "Gagal memuat data tugas.")}</p>`;
            return;
        }

        taskList.innerHTML = "";

        if (data.length === 0) {
            taskList.innerHTML = '<p class="empty">Belum ada tugas.</p>';
            return;
        }

        data.forEach(task => {
            taskList.innerHTML += `
                <div class="task-card">
                    <h3>${escapeHTML(task.nama_tugas)}</h3>
                    <p><strong>Mata Kuliah:</strong> ${escapeHTML(task.mata_kuliah)}</p>
                    <p><strong>Deskripsi:</strong> ${escapeHTML(task.deskripsi)}</p>
                    <p><strong>Deadline:</strong> ${escapeHTML(task.deadline)}</p>
                    <p><strong>Prioritas:</strong> ${escapeHTML(task.prioritas)}</p>
                    <p><strong>Status:</strong> ${escapeHTML(task.status)}</p>

                    <div class="task-actions">
                        <button class="edit" onclick="editTask('${escapeHTML(task._id)}')">Edit</button>
                        <button class="delete" onclick="deleteTask('${escapeHTML(task._id)}')">Hapus</button>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        taskList.innerHTML = '<p class="empty">Gagal terhubung ke server.</p>';
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const data = {
        nama_tugas: document.getElementById("nama_tugas").value,
        mata_kuliah: document.getElementById("mata_kuliah").value,
        deskripsi: document.getElementById("deskripsi").value,
        deadline: document.getElementById("deadline").value,
        prioritas: document.getElementById("prioritas").value,
        status: document.getElementById("status").value
    };

    const id = taskId.value;

    const response = await fetch(
        id ? `/api/tasks/${id}` : "/api/tasks",
        {
            method: id ? "PUT" : "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(data)
        }
    );

    if (!response.ok) {
        alert("Gagal menyimpan tugas.");
        return;
    }

    alert(id ? "Tugas berhasil diperbarui!" : "Tugas berhasil ditambahkan!");

    form.reset();
    taskId.value = "";
    submitBtn.textContent = "Simpan Tugas";
    cancelBtn.hidden = true;
    document.getElementById("form-title").textContent = "Tambah Tugas";

    loadTasks();
});

async function editTask(id) {
    const response = await fetch("/api/tasks");
    const data = await response.json();
    const task = data.find(item => item._id === id);

    if (!task) return;

    taskId.value = task._id;
    document.getElementById("nama_tugas").value = task.nama_tugas;
    document.getElementById("mata_kuliah").value = task.mata_kuliah;
    document.getElementById("deskripsi").value = task.deskripsi;
    document.getElementById("deadline").value = task.deadline;
    document.getElementById("prioritas").value = task.prioritas;
    document.getElementById("status").value = task.status;

    submitBtn.textContent = "Perbarui Tugas";
    cancelBtn.hidden = false;

    document.getElementById("form-title").textContent = "Edit Tugas";
    window.scrollTo({top: 0, behavior: "smooth"});
}

async function deleteTask(id) {
    if (!confirm("Yakin ingin menghapus tugas ini?")) return;

    const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE"
    });

    if (response.ok) {
        alert("Tugas berhasil dihapus!");
        loadTasks();
    }
}

cancelBtn.addEventListener("click", function() {
    form.reset();
    taskId.value = "";
    submitBtn.textContent = "Simpan Tugas";
    cancelBtn.hidden = true;
    document.getElementById("form-title").textContent = "Tambah Tugas";
});

loadTasks();
