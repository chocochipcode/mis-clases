// =========================================
// SUPABASE
// =========================================

const SUPABASE_URL =
    "https://plsqsbfclxlybhbwqyav.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_WnLbQzd_NC8jih3pojZXlA_cbK6Ptia";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================================
// ESTADO DE LA APLICACIÓN
// =========================================

let students = [];

let isAdmin = false;


// =========================================
// ELEMENTOS
// =========================================

const navButtons =
    document.querySelectorAll(".nav-button");

const pages =
    document.querySelectorAll(".page");


const modal =
    document.getElementById("studentModal");


const adminModal =
    document.getElementById("adminModal");


const adminButton =
    document.getElementById("adminButton");


const logoutButton =
    document.getElementById("logoutButton");


const openStudentButton =
    document.getElementById("openStudentButton");


const openStudentButton2 =
    document.getElementById("openStudentButton2");


const closeStudentButton =
    document.getElementById("closeStudentButton");


const cancelStudentButton =
    document.getElementById("cancelStudentButton");


const closeAdminButton =
    document.getElementById("closeAdminButton");


const cancelAdminButton =
    document.getElementById("cancelAdminButton");


const studentForm =
    document.getElementById("studentForm");


const adminLoginForm =
    document.getElementById("adminLoginForm");


const firstNameInput =
    document.getElementById("firstName");


const lastNameInput =
    document.getElementById("lastName");


const adminEmail =
    document.getElementById("adminEmail");


const adminPassword =
    document.getElementById("adminPassword");


const loginError =
    document.getElementById("loginError");


const totalStudents =
    document.getElementById("totalStudents");


const unpaidCount =
    document.getElementById("unpaidCount");


const classStudentCount =
    document.getElementById("classStudentCount");


const studentList =
    document.getElementById("studentList");


const unpaidList =
    document.getElementById("unpaidList");


const paymentList =
    document.getElementById("paymentList");


const newMonthButton =
    document.getElementById("newMonthButton");


// =========================================
// MES ACTUAL
// =========================================

function getCurrentMonth() {

    const now = new Date();

    return `${now.getFullYear()}-${now.getMonth() + 1}`;

}


// =========================================
// NAVEGACIÓN
// =========================================

navButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const sectionId =
            button.dataset.section;


        navButtons.forEach(function(btn) {

            btn.classList.remove("active");

        });


        button.classList.add("active");


        pages.forEach(function(page) {

            page.classList.remove("active-page");

        });


        const selectedPage =
            document.getElementById(sectionId);


        if (selectedPage) {

            selectedPage.classList.add(
                "active-page"
            );

        }

    });

});


// =========================================
// CARGAR ALUMNOS DESDE SUPABASE
// =========================================

async function loadStudents() {

    const {
        data,
        error
    } = await supabaseClient
        .from("alumnos")
        .select("*")
        .order("apellido", {
            ascending: true
        });


    if (error) {

        console.error(error);

        alert(
            "No se pudieron cargar los alumnos."
        );

        return;

    }


    students = data || [];


    await updateMonth();


    renderEverything();

}


// =========================================
// ACTUALIZAR MES
// =========================================

async function updateMonth() {

    const currentMonth =
        getCurrentMonth();


    const oldStudents =
        students.filter(function(student) {

            return student.mes_pago !== currentMonth;

        });


    if (oldStudents.length === 0) {

        return;

    }


    /*
       Si el mes cambió:

       - Los alumnos permanecen.
       - El pago vuelve a "no".
       - Solo los administradores pueden
         hacer esta modificación.
    */

    if (!isAdmin) {

        return;

    }


    for (const student of oldStudents) {

        const {
            error
        } = await supabaseClient
            .from("alumnos")
            .update({
                pago: "no",
                mes_pago: currentMonth
            })
            .eq("id", student.id);


        if (error) {

            console.error(error);

        }

    }


    await loadStudentsWithoutMonthCheck();

}


// =========================================
// CARGAR SIN VOLVER A ACTUALIZAR MES
// =========================================

async function loadStudentsWithoutMonthCheck() {

    const {
        data,
        error
    } = await supabaseClient
        .from("alumnos")
        .select("*")
        .order("apellido", {
            ascending: true
        });


    if (!error) {

        students = data || [];

    }

}


// =========================================
// ABRIR MODAL ALUMNO
// =========================================

function openModal() {

    if (!isAdmin) {

        return;

    }


    modal.classList.add("show");


    firstNameInput.value = "";

    lastNameInput.value = "";


    const unpaidRadio =
        document.querySelector(
            'input[name="payment"][value="no"]'
        );


    if (unpaidRadio) {

        unpaidRadio.checked = true;

    }


    firstNameInput.focus();

}


// =========================================
// CERRAR MODAL ALUMNO
// =========================================

function closeModal() {

    modal.classList.remove("show");

}


// =========================================
// ABRIR LOGIN
// =========================================

function openAdminModal() {

    adminModal.classList.add("show");

    loginError.style.display = "none";

    loginError.textContent = "";

    adminEmail.value = "";

    adminPassword.value = "";

    adminEmail.focus();

}


// =========================================
// CERRAR LOGIN
// =========================================

function closeAdminModal() {

    adminModal.classList.remove("show");

}


// =========================================
// BOTÓN ADMINISTRAR
// =========================================

adminButton.addEventListener(
    "click",
    function() {

        if (isAdmin) {

            return;

        }

        openAdminModal();

    }
);


// =========================================
// LOGIN
// =========================================

adminLoginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        loginError.style.display = "none";


        const email =
            adminEmail.value.trim();


        const password =
            adminPassword.value;


        const {
            data,
            error
        } = await supabaseClient.auth
            .signInWithPassword({
                email: email,
                password: password
            });


        if (error) {

            console.error(error);

            loginError.textContent =
                "Correo o contraseña incorrectos.";

            loginError.style.display =
                "block";

            return;

        }


        if (!data.session) {

            loginError.textContent =
                "No se pudo iniciar la sesión.";

            loginError.style.display =
                "block";

            return;

        }


        isAdmin = true;


        closeAdminModal();

        updateAdminInterface();


        await loadStudents();

    }
);


// =========================================
// CERRAR SESIÓN
// =========================================

logoutButton.addEventListener(
    "click",
    async function() {

        await supabaseClient.auth.signOut();

        isAdmin = false;

        updateAdminInterface();

        await loadStudents();

    }
);


// =========================================
// ESTADO DE INTERFAZ
// =========================================

function updateAdminInterface() {

    if (isAdmin) {

        adminButton.style.display =
            "none";


        logoutButton.style.display =
            "block";


        openStudentButton.style.display =
            "block";


        openStudentButton2.style.display =
            "block";


        newMonthButton.style.display =
            "block";

    } else {

        adminButton.style.display =
            "block";


        logoutButton.style.display =
            "none";


        openStudentButton.style.display =
            "none";


        openStudentButton2.style.display =
            "none";


        newMonthButton.style.display =
            "none";

    }


    renderEverything();

}


// =========================================
// BOTONES MODAL ALUMNO
// =========================================

openStudentButton.addEventListener(
    "click",
    openModal
);


openStudentButton2.addEventListener(
    "click",
    openModal
);


closeStudentButton.addEventListener(
    "click",
    closeModal
);


cancelStudentButton.addEventListener(
    "click",
    closeModal
);


// =========================================
// BOTONES MODAL ADMIN
// =========================================

closeAdminButton.addEventListener(
    "click",
    closeAdminModal
);


cancelAdminButton.addEventListener(
    "click",
    closeAdminModal
);


// =========================================
// CERRAR MODALES AL HACER CLICK AFUERA
// =========================================

modal.addEventListener(
    "click",
    function(event) {

        if (event.target === modal) {

            closeModal();

        }

    }
);


adminModal.addEventListener(
    "click",
    function(event) {

        if (event.target === adminModal) {

            closeAdminModal();

        }

    }
);


// =========================================
// ESC
// =========================================

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Escape") {

            return;

        }


        closeModal();

        closeAdminModal();

    }
);


// =========================================
// AGREGAR ALUMNO
// =========================================

studentForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        if (!isAdmin) {

            return;

        }


        const firstName =
            firstNameInput.value.trim();


        const lastName =
            lastNameInput.value.trim();


        if (
            firstName === "" ||
            lastName === ""
        ) {

            return;

        }


        const paymentRadio =
            document.querySelector(
                'input[name="payment"]:checked'
            );


        const paymentStatus =
            paymentRadio
                ? paymentRadio.value
                : "no";


        const {
            error
        } = await supabaseClient
            .from("alumnos")
            .insert({
                nombre: firstName,
                apellido: lastName,
                pago: paymentStatus,
                mes_pago: getCurrentMonth()
            });


        if (error) {

            console.error(error);

            alert(
                "No se pudo guardar el alumno."
            );

            return;

        }


        closeModal();


        await loadStudents();

    }
);


// =========================================
// CAMBIAR ESTADO DE PAGO
// =========================================

async function togglePayment(studentId) {

    if (!isAdmin) {

        return;

    }


    const student =
        students.find(function(student) {

            return student.id === studentId;

        });


    if (!student) {

        return;

    }


    const newStatus =
        student.pago === "si"
            ? "no"
            : "si";


    const {
        error
    } = await supabaseClient
        .from("alumnos")
        .update({
            pago: newStatus,
            mes_pago: getCurrentMonth()
        })
        .eq("id", studentId);


    if (error) {

        console.error(error);

        alert(
            "No se pudo cambiar el estado del pago."
        );

        return;

    }


    await loadStudents();

}


// =========================================
// ELIMINAR ALUMNO
// =========================================

async function deleteStudent(studentId) {

    if (!isAdmin) {

        return;

    }


    const student =
        students.find(function(student) {

            return student.id === studentId;

        });


    if (!student) {

        return;

    }


    const confirmed =
        confirm(
            `¿Querés eliminar a ${student.nombre} ${student.apellido}?`
        );


    if (!confirmed) {

        return;

    }


    const {
        error
    } = await supabaseClient
        .from("alumnos")
        .delete()
        .eq("id", studentId);


    if (error) {

        console.error(error);

        alert(
            "No se pudo eliminar el alumno."
        );

        return;

    }


    await loadStudents();

}


// =========================================
// NUEVO MES
// =========================================

async function startNewMonth() {

    if (!isAdmin) {

        return;

    }


    if (students.length === 0) {

        alert(
            "No hay alumnos registrados."
        );

        return;

    }


    const confirmed =
        confirm(
            "¿Querés comenzar un nuevo mes?\n\n" +
            "Todos los alumnos seguirán registrados, " +
            "pero todos pasarán a \"No pagó\"."
        );


    if (!confirmed) {

        return;

    }


    const currentMonth =
        getCurrentMonth();


    const {
        error
    } = await supabaseClient
        .from("alumnos")
        .update({
            pago: "no",
            mes_pago: currentMonth
        })
        .neq("id", 0);


    if (error) {

        console.error(error);

        alert(
            "No se pudo iniciar el nuevo mes."
        );

        return;

    }


    await loadStudents();


    alert(
        "Nuevo mes iniciado. " +
        "Todos los alumnos figuran como no pagados."
    );

}


newMonthButton.addEventListener(
    "click",
    startNewMonth
);


// =========================================
// CREAR ELEMENTO DE ALUMNO
// =========================================

function createStudentItem(student) {

    const item =
        document.createElement("div");


    item.className =
        "student-item";


    // -----------------------------------------
    // NOMBRE
    // -----------------------------------------

    const name =
        document.createElement("span");


    name.className =
        "student-name";


    name.textContent =
        `${student.nombre} ${student.apellido}`;


    if (student.pago === "no") {

        name.style.color =
            "#b42318";

    }


    item.appendChild(name);


    // -----------------------------------------
    // ACCIONES
    // -----------------------------------------

    const actions =
        document.createElement("div");


    actions.style.display =
        "flex";


    actions.style.alignItems =
        "center";


    actions.style.gap =
        "10px";


    // -----------------------------------------
    // ESTADO DE PAGO
    // -----------------------------------------

    let paymentElement;


    if (isAdmin) {

        paymentElement =
            document.createElement("button");


        paymentElement.type =
            "button";


        paymentElement.className =
            "student-status";


        paymentElement.addEventListener(
            "click",
            function() {

                togglePayment(student.id);

            }
        );

    } else {

        paymentElement =
            document.createElement("span");


        paymentElement.className =
            "student-status";

    }


    if (student.pago === "si") {

        paymentElement.classList.add(
            "paid"
        );

        paymentElement.textContent =
            "PAGÓ";

    } else {

        paymentElement.classList.add(
            "unpaid"
        );

        paymentElement.textContent =
            "NO PAGÓ";

    }


    actions.appendChild(
        paymentElement
    );


    // -----------------------------------------
    // ELIMINAR
    // -----------------------------------------

    if (isAdmin) {

        const deleteButton =
            document.createElement("button");


        deleteButton.type =
            "button";


        deleteButton.textContent =
            "Eliminar";


        deleteButton.style.background =
            "#eef0f2";


        deleteButton.style.color =
            "#4f5a63";


        deleteButton.style.borderRadius =
            "7px";


        deleteButton.style.padding =
            "7px 10px";


        deleteButton.style.fontSize =
            "12px";


        deleteButton.style.fontWeight =
            "600";


        deleteButton.addEventListener(
            "click",
            function() {

                deleteStudent(
                    student.id
                );

            }
        );


        actions.appendChild(
            deleteButton
        );

    }


    item.appendChild(actions);


    return item;

}


// =========================================
// LISTA DE ALUMNOS
// =========================================

function renderStudentList() {

    studentList.innerHTML = "";


    if (students.length === 0) {

        const empty =
            document.createElement("div");


        empty.className =
            "empty-state";


        empty.innerHTML = `
            <h3>Todavía no tienes alumnos</h3>
            <p>
                Agrega tu primer alumno para comenzar.
            </p>
        `;


        studentList.appendChild(empty);

        return;

    }


    students.forEach(function(student) {

        studentList.appendChild(
            createStudentItem(student)
        );

    });

}


// =========================================
// LISTA NO PAGARON
// =========================================

function renderUnpaidList() {

    unpaidList.innerHTML = "";


    const unpaidStudents =
        students.filter(function(student) {

            return student.pago === "no";

        });


    if (unpaidStudents.length === 0) {

        const empty =
            document.createElement("div");


        empty.className =
            "empty-state";


        empty.innerHTML = `
            <h3>No hay pagos pendientes</h3>
            <p>
                Cuando un alumno no haya pagado,
                aparecerá aquí.
            </p>
        `;


        unpaidList.appendChild(empty);

        return;

    }


    unpaidStudents.forEach(
        function(student) {

            unpaidList.appendChild(
                createStudentItem(student)
            );

        }
    );

}


// =========================================
// LISTA DE PAGOS
// =========================================

function renderPaymentList() {

    paymentList.innerHTML = "";


    if (students.length === 0) {

        const empty =
            document.createElement("div");


        empty.className =
            "empty-state";


        empty.innerHTML = `
            <h3>No hay alumnos registrados</h3>
            <p>
                Los pagos aparecerán aquí
                cuando agregues alumnos.
            </p>
        `;


        paymentList.appendChild(empty);

        return;

    }


    students.forEach(function(student) {

        paymentList.appendChild(
            createStudentItem(student)
        );

    });

}


// =========================================
// CONTADORES
// =========================================

function updateCounters() {

    const total =
        students.length;


    const unpaid =
        students.filter(function(student) {

            return student.pago === "no";

        }).length;


    totalStudents.textContent =
        total;


    classStudentCount.textContent =
        total;


    unpaidCount.textContent =
        unpaid;

}


// =========================================
// RENDERIZAR TODO
// =========================================

function renderEverything() {

    updateCounters();

    renderStudentList();

    renderUnpaidList();

    renderPaymentList();

}


// =========================================
// COMPROBAR SESIÓN
// =========================================

async function checkSession() {

    const {
        data
    } = await supabaseClient.auth
        .getSession();


    isAdmin =
        !!data.session;


    updateAdminInterface();


    await loadStudents();

}


// =========================================
// ESCUCHAR CAMBIOS DE SESIÓN
// =========================================

supabaseClient.auth.onAuthStateChange(
    function(event, session) {

        isAdmin =
            !!session;


        updateAdminInterface();

    }
);


// =========================================
// INICIAR APLICACIÓN
// =========================================

checkSession();
