const attractionsList = document.getElementById('attractionsList');
async function loadAttractions() {
    try {
        const response = await fetch('/admin/attractions');
        const attractions = await response.json();
        attractionsList.innerHTML = '';
        attractions.forEach(attraction => {
            const li = document.createElement('li');
            li.innerHTML = `
                <h3>${attraction.name}</h3>
                <p>${attraction.description}</p>
                <div class="image-container">
                    ${attraction.images.map(image => `<img src="${image}" alt="Attraction Image">`).join('')}
                </div>
                <div>
                    <button class="edit" onclick="editAttraction('${attraction._id}', '${attraction.name}', '${attraction.description}')">Edit</button>
                    <button class="delete" onclick="deleteAttraction('${attraction._id}')">Delete</button>
                </div>
            `;
            attractionsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading attractions:', error);
    }
}

async function editAttraction(id, name, description) {
    const newName = prompt("Enter new name:", name);
    const newDescription = prompt("Enter new description:", description);
    if (newName !== null && newDescription !== null) {
        try {
            const response = await fetch(`/admin/attractions/edit/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newName,
                    description: newDescription
                })
            });
            if (response.ok) {

                loadAttractions();
            } else {
                console.error('Edit failed:', response.statusText);
            }
        } catch (error) {
            console.error('Error editing attraction:', error);
        }
    }
}

async function deleteAttraction(id) {
    try {
        const response = await fetch(`/admin/attractions/delete/${id}`, {
            method: 'POST'
        });
        if (response.ok) {
            loadAttractions();
        } else {
            console.error('Delete failed:', response.statusText);
        }
    } catch (error) {
        console.error('Error deleting attraction:', error);
    }
}
window.onload = loadAttractions;
