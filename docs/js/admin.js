document.addEventListener('DOMContentLoaded', () => {
  // === DOM ELEMENTS ===
  const loginForm = document.getElementById('login-form')
  const loginError = document.getElementById('login-error')
  const dashboard = document.getElementById('admin-dashboard')
  const loginSection = document.getElementById('admin-login')
  const logo = document.getElementById('logo')
  const logoutBtn = document.getElementById('logout-btn')
  const inventoryForm = document.getElementById('inventory-form')
  const inventoryTableBody = document.getElementById('inventory-table-body')
  const imageInput = document.getElementById('product-image')
  const imagePreview = document.getElementById('image-preview')

  // === LOGIN LOGIC ===
  loginForm.addEventListener('submit', e => {
    e.preventDefault()
    const name = loginForm.name.value.trim()
    const password = loginForm.password.value.trim()
    if (name === 'Hamad' && password === '123') {
      loginSection.style.display = 'none'
      dashboard.style.display = 'block'
      logo.textContent = 'Skin&Scents'
      logoutBtn.style.display = 'inline-block'
      fetchAndRenderSales() // ✅ this line here
      updateHighlightCards()
    } else {
      loginError.textContent = 'Incorrect name or password.'
      loginError.style.color = 'red'
    }
  })

  async function updateHighlightCards () {
    const res = await fetch('https://ug-backend-wkk1.onrender.com/api/sales')
    const sales = await res.json()

    let totalSalesQty = 0
    let totalSalesPrice = 0
    const productMap = {} // name => { qty, totalPrice }
    const locationCount = {}
    const genderCount = {}

    for (const sale of sales) {
      totalSalesQty += sale.cart.reduce((sum, item) => sum + item.quantity, 0)
      totalSalesPrice += sale.cart.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0
      )

      // Product-based aggregations
      for (const item of sale.cart) {
        const key = `${item.name}_${item.category}` // combine name + category
        if (!productMap[key]) {
          productMap[key] = {
            name: item.name,
            category: item.category,
            qty: 0,
            price: item.price,
            total: 0
          }
        }
        productMap[key].qty += item.quantity
        productMap[key].total += item.quantity * item.price
      }

      // Location + Gender count
      locationCount[sale.location] = (locationCount[sale.location] || 0) + 1
      genderCount[sale.gender] = (genderCount[sale.gender] || 0) + 1
    }

    // Top/Least sold
    const sortedProducts = Object.entries(productMap).sort(
      (a, b) => b[1].qty - a[1].qty
    )
    const mostSold = sortedProducts[0]
    const leastSold = sortedProducts[sortedProducts.length - 1]
    const mostProfitable = Object.entries(productMap).sort(
      (a, b) => b[1].total - a[1].total
    )[0]
    const topLocationEntry = Object.entries(locationCount).sort(
      (a, b) => b[1] - a[1]
    )[0]
    const topGenderEntry = Object.entries(genderCount).sort(
      (a, b) => b[1] - a[1]
    )[0]
    const uniqueCustomers = new Set(sales.map(s => s.email))
    const avgSpend = totalSalesPrice / uniqueCustomers.size
    const recentSaleDate = sales[0]?.createdAt
    const hourlyCount = {}

    sales.forEach(s => {
      const hour = new Date(s.createdAt).getHours()
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1
    })

    const peakHour = Object.entries(hourlyCount).sort((a, b) => b[1] - a[1])[0]

    // Set card values
    document.getElementById(
      'total-sales-price'
    ).textContent = `$${totalSalesPrice.toFixed(2)}`
    document.getElementById('total-sales-qty').textContent = totalSalesQty

    document.getElementById(
      'most-sold-name'
    ).textContent = `${mostSold?.[1]?.name} (${mostSold?.[1]?.category})`
    document.getElementById('most-sold-price').textContent = `$${
      mostSold?.[1]?.price || 0
    }`
    document.getElementById('most-sold-qty').textContent =
      mostSold?.[1]?.qty || 0

    document.getElementById(
      'least-sold-name'
    ).textContent = `${leastSold?.[1]?.name} (${leastSold?.[1]?.category})`
    document.getElementById('least-sold-price').textContent = `$${
      leastSold?.[1]?.price || 0
    }`
    document.getElementById('least-sold-qty').textContent =
      leastSold?.[1]?.qty || 0

    document.getElementById('top-location').textContent =
      Object.entries(locationCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    document.getElementById('top-gender').textContent =
      Object.entries(genderCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
    document.getElementById('profitable-name').textContent =
      mostProfitable?.[0] || '-'
    document.getElementById('profitable-amount').textContent = `$${
      mostProfitable?.[1]?.total.toFixed(2) || 0
    }`

    document.getElementById('top-location').textContent =
      topLocationEntry?.[0] || '-'
      document.getElementById('top-location-count').textContent =
  topLocationEntry?.[1] || 0;
    document
      .getElementById('top-location')
      .closest('.card')
      .classList.add('green')

    document.getElementById('top-gender').textContent =
      topGenderEntry?.[0] || '-'
    document.getElementById('top-gender-count').textContent =
      topGenderEntry?.[1] || 0

    document.getElementById('avg-spend').textContent = `$${avgSpend.toFixed(2)}`

    document.getElementById('recent-sale').textContent = recentSaleDate
      ? new Date(recentSaleDate).toLocaleString()
      : '-'

    document.getElementById('peak-hour').textContent = peakHour
      ? `${peakHour[0] % 12 || 12}:00 ${peakHour[0] < 12 ? 'AM' : 'PM'}`
      : '-'

    document
      .getElementById('most-sold-name')
      .closest('.card')
      .classList.add('green')
    document
      .getElementById('profitable-name')
      .closest('.card')
      .classList.add('green')
    document
      .getElementById('top-gender')
      .closest('.card')
      .classList.add('green')

    document
      .getElementById('least-sold-name')
      .closest('.card')
      .classList.add('red')

    const suggestionsList = document.getElementById('suggestion-list')
    suggestionsList.innerHTML = '' // Clear previous

    try {
      const inventoryRes = await fetch('https://ug-backend-wkk1.onrender.com/api/products')
      const inventory = await inventoryRes.json()

      const suggestions = []

      // Map product sales
      const productSalesMap = {}
      sales.forEach(sale => {
        sale.cart.forEach(item => {
          const key = `${item.name}_${item.category}`
          productSalesMap[key] = (productSalesMap[key] || 0) + item.quantity
        })
      })

      // Suggestion from inventory vs sales
      inventory.forEach(product => {
        const key = `${product.name}_${product.category}`
        const soldQty = productSalesMap[key] || 0

        if (soldQty === 0) {
          suggestions.push({
            text: `${product.name} (${product.category}) has no recent sales. You may want to discount it, promote it on social media, or consider replacing it.`,
            type: 'red'
          })
        } else if (soldQty > 0 && product.quantity <= 3) {
          suggestions.push({
            text: `${product.name} (${product.category}) is selling well but stock is low. Restock soon to avoid losing sales.`,
            type: 'red'
          })
        } else if (soldQty >= 5) {
          suggestions.push({
            text: `${product.name} (${product.category}) is a top-performing product. Consider bundling it or featuring it more prominently.`,
            type: 'green'
          })
        }
      })

      // Location + Gender based suggestion
      if (topLocationEntry?.[1] >= 3) {
        suggestions.push({
          text: `Strong sales in ${topLocationEntry[0]}. Run geo-targeted discounts, pop-up events, or influencer campaigns.`,
          type: 'green'
        })
      }

      if (topGenderEntry?.[1] >= 3) {
        suggestions.push({
          text: `${topGenderEntry[0]} customers are engaging most. You could tailor ads or product recommendations for them.`,
          type: 'green'
        })
      }

      // Render to UI
      suggestions.forEach(s => {
        const li = document.createElement('li')
        li.classList.add(s.type)
        li.textContent = s.text
        suggestionsList.appendChild(li)
      })
      // === CHARTS: Top 3 Products by Gender & Sales by Location ===
      const genderProductMap = {} // { "Product Name - Category": { Male: x, Female: y, Unisex: z } }
      const locationStats = {} // location => { revenue, customers }
      sales.forEach(sale => {
        if (sale.consent !== 'Yes') return
      
        const location = sale.location
        if (!locationStats[location]) {
          locationStats[location] = { revenue: 0, customers: 0 }
        }
      
        locationStats[location].customers += 1
      
        sale.cart.forEach(item => {
          locationStats[location].revenue += item.quantity * item.price;
      
          // ✅ Populate genderProductMap here:
          const key = `${item.name} (${item.category})`;
          const gender = sale.gender || 'Prefer Not to Say';
      
          if (!genderProductMap[key]) {
            genderProductMap[key] = {};
          }
      
          genderProductMap[key][gender] = (genderProductMap[key][gender] || 0) + (item.quantity * item.price);
        });
      })

      // === BAR CHART: Gender-based Top 3 Products ===
      const sortedProducts = Object.entries(genderProductMap)
        .map(([label, genders]) => ({
          label,
          total: Object.values(genders).reduce((a, b) => a + b, 0),
          ...genders
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3)

      const barLabels = sortedProducts.map(p => p.label)
      const maleData = sortedProducts.map(p => p.Male || 0)
      const femaleData = sortedProducts.map(p => p.Female || 0)
      const unisexData = sortedProducts.map(p => p.Unisex || 0)

      const barCtx = document.getElementById('genderBarChart').getContext('2d')

      // Get total gender counts
      const totalGenders = {
        Male: genderCount.Male || 0,
        Female: genderCount.Female || 0,
        'Prefer Not to Say': genderCount['Prefer Not to Say'] || 0
      }

      // Get inventory for top 3 products
      const topInventory = await fetch(
        'https://ug-backend-wkk1.onrender.com/api/products'
      ).then(res => res.json())
      const inventoryMap = {}
      topInventory.forEach(p => {
        const key = `${p.name} (${p.category})`
        inventoryMap[key] = p.quantity
      })

      // Remove datalabels from chart by disabling plugin
      new Chart(barCtx, {
        type: 'bar',
        data: {
          labels: sortedProducts.map(p => p.label),
          datasets: [
            {
              label: `Male`,
              data: sortedProducts.map(p => p.Male || 0),
              backgroundColor: '#4285F4'
            },
            {
              label: `Female`,
              data: sortedProducts.map(p => p.Female || 0),
              backgroundColor: '#DB4437'
            },
            {
              label: `Prefer Not to Say`,
              data: sortedProducts.map(p => p['Prefer Not to Say'] || 0),
              backgroundColor: '#F4B400'
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              callbacks: {
                label: () => '', // ✅ cleanly removes default "4 units" line
                afterLabel: function (context) {
                  const index = context.dataIndex
                  const datasetLabel = context.dataset.label
                  const product = sortedProducts[index]

                  const gender = datasetLabel.includes('Male')
                    ? 'Male'
                    : datasetLabel.includes('Female')
                    ? 'Female'
                    : 'Prefer Not to Say'

                  const genderRevenue = product[gender] || 0

                  return [
                    `$${genderRevenue.toFixed(
                      2
                    )} in revenue from ${gender} customers`
                  ]
                }
              }
            },
            legend: { position: 'top' },
            title: {
              display: true,
              text: 'Top 3 Highest Revenue Products by Gender',
              font: {
                size: 20,
                weight: 'bold'
              },
              padding: {
                bottom: 30 // Adds more space below the title
              }
            },
            datalabels: {
              display: false // 👈 disables numbers inside bars
            }
          }
        },
        plugins: [] // 👈 don't use ChartDataLabels
      })

      // === PIE CHART: Sales by Location ===
const pieLabels = Object.keys(locationStats)
const pieRevenueValues = pieLabels.map(loc => locationStats[loc].revenue)
const pieCustomerCounts = pieLabels.map(loc => locationStats[loc].customers)

const totalRevenue = pieRevenueValues.reduce((a, b) => a + b, 0)
const totalCustomers = pieCustomerCounts.reduce((a, b) => a + b, 0)

const pieCtx = document.getElementById('locationPieChart').getContext('2d');
new Chart(pieCtx, {
  type: 'doughnut',
  data: {
    labels: pieLabels,
    datasets: [
      {
        label: 'Revenue',
        data: pieRevenueValues,
        backgroundColor: ['#F4B400', '#0F9D58', '#DB4437', '#4285F4']
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 14 }, padding: 15 }
      },
      title: {
        display: true,
        text: 'Revenue & Customer Distribution (by Location)',
        font: { size: 22, weight: 'bold' },
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const location = context.label
            const revenue = locationStats[location].revenue
            const percentRevenue = ((revenue / totalRevenue) * 100).toFixed(1)
            const customers = locationStats[location].customers
            const percentCustomers = (
              (customers / totalCustomers) *
              100
            ).toFixed(1)

            return [
              `${location}`,
              `$${revenue.toFixed(2)} in revenue`,
              `${percentRevenue}% of total revenue`,
              `${customers} customers (${percentCustomers}%)`
            ]
          }
        }
      }
    }
  }
})} catch (err) {
      console.error('Failed to generate suggestions:', err)
    }
  }

  async function fetchAndRenderSales () {
    const salesTableBody = document.getElementById('sales-table-body')
    const searchInput = document.getElementById('searchSales')
    const sortField = document.getElementById('sortSalesField')
    const sortRadios = document.querySelectorAll("input[name='sortSalesOrder']")

    let salesData = []

    async function fetchSales () {
      try {
        const res = await fetch('https://ug-backend-wkk1.onrender.com/api/sales')
        salesData = await res.json()
        renderSales(salesData)
      } catch (err) {
        console.error('Failed to fetch sales data:', err)
      }
    }

    function renderSales (data) {
      salesTableBody.innerHTML = ''

      const sortKey = sortField.value // 'qty' or 'price'
      const sortOrder = [...sortRadios].find(r => r.checked)?.value || 'asc'
      const keyword = searchInput.value.toLowerCase()

      const flattened = data.flatMap(sale =>
        sale.cart.map(product => ({
          saleId: sale._id,
          productId: product.id,
          productName: product.name,
          category: product.category || '-',
          price: product.price,
          quantity: product.quantity,
          total: product.price * product.quantity,
          customer: `${sale.name} ${sale.email}`,
          saleDate: sale.createdAt,
          location: sale.location ?? '-',
          gender: sale.gender ?? '-'
        }))
      )

      const filtered = flattened.filter(
        row =>
          row.productName.toLowerCase().includes(keyword) ||
          row.customer.toLowerCase().includes(keyword)
      )

      filtered.sort((a, b) => {
        const dateSortOrder =
          document.querySelector('input[name="dateSortOrder"]:checked')
            ?.value || 'desc'

        flattened.sort((a, b) => {
          const dateA = new Date(a.saleDate)
          const dateB = new Date(b.saleDate)
          return dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA
        })

        const aVal = sortKey === 'price' ? a.total : a.quantity
        const bVal = sortKey === 'price' ? b.total : b.quantity
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
      })
      filtered.forEach(row => {
        const tr = document.createElement('tr')
        tr.innerHTML = `
          <td>${row.saleId}</td>
  <td>${row.productId}</td>
  <td>${row.productName}</td>
  <td>${row.category}</td>
  <td>$${row.price}</td>
  <td>${row.quantity}</td>
  <td>$${row.total.toFixed(2)}</td>
  <td>${row.location}</td>
  <td>${row.gender}</td>
  <td>${new Date(row.saleDate).toLocaleDateString()}</td>
        `
        salesTableBody.appendChild(tr)
      })
    }

    document.getElementById('download-sales').addEventListener('click', () => {
      const rows = document.querySelectorAll('#sales-table-body tr')
      const data = Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td')
        return {
          SalesID: cells[0].textContent,
          ProductID: cells[1].textContent,
          ProductName: cells[2].textContent,
          Category: cells[3].textContent,
          Price: cells[4].textContent,
          Quantity: cells[5].textContent,
          TotalPrice: cells[6].textContent
        }
      })

      downloadCSV(data, 'sales.csv', [
        'SalesID',
        'ProductID',
        'ProductName',
        'Category',
        'Price',
        'Quantity',
        'TotalPrice'
      ])
    })

    // Setup real-time controls
    searchInput.addEventListener('input', () => renderSales(salesData))
    sortField.addEventListener('change', () => renderSales(salesData))
    sortRadios.forEach(r =>
      r.addEventListener('change', () => renderSales(salesData))
    )

    await fetchSales()
  }

  logoutBtn.addEventListener('click', e => {
    e.preventDefault()
    window.scrollTo({ top: 0 })
    setTimeout(() => {
      dashboard.style.display = 'none'
      loginSection.style.display = 'flex'
      loginForm.reset()
      logo.textContent = 'Business Portal'
      logoutBtn.style.display = 'none'
      loginError.textContent = ''
    }, 50)
  })

  // === ADD PRODUCT TO DB ===
  async function addProductToDB (productData, imageFile) {
    const formData = new FormData()
    formData.append('name', productData.name)
    formData.append('price', productData.price)
    formData.append('quantity', productData.quantity)
    formData.append('category', productData.category)
    formData.append('image', imageFile)

    const response = await fetch('https://ug-backend-wkk1.onrender.com/api/products', {
      method: 'POST',
      body: formData
    })
    return await response.json()
  }

  // === PREVIEW IMAGE ON FILE SELECT ===
  imageInput.addEventListener('change', function () {
    const file = this.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = function () {
        imagePreview.src = reader.result
        imagePreview.style.display = 'block'
      }
      reader.readAsDataURL(file)
    } else {
      imagePreview.style.display = 'none'
    }
  })

  // === ADD PRODUCT FORM SUBMIT ===
  inventoryForm.addEventListener('submit', async function (e) {
    e.preventDefault()
    if (e.submitter?.id !== 'add-product-btn') return

    const name = document.getElementById('product-name').value.trim()
    const quantity = parseInt(document.getElementById('product-qty').value)
    const price = parseFloat(document.getElementById('product-price').value)
    const category = document.getElementById('Product-category').value
    const file = imageInput.files[0]

    if (!name || isNaN(quantity) || isNaN(price) || !category || !file) {
      alert('Please fill in all required fields.')
      return
    }

    try {
      const productData = { name, price, quantity, category }
      await addProductToDB(productData, file)
      await fetchInventoryProducts()
      inventoryForm.reset()
      imagePreview.style.display = 'none'
      alert('Product added successfully!')
    } catch (error) {
      console.error('Error adding product:', error)
      alert('Failed to add product. Please try again.')
    }
  })

  // === DELETE PRODUCT ===
  document
    .getElementById('delete-product-btn')
    .addEventListener('click', async () => {
      const nameToDelete = document.getElementById('product-name').value.trim()
      const categoryToDelete = document.getElementById('Product-category').value

      if (!nameToDelete || !categoryToDelete) {
        alert('Please fill in both Product Name and Category to delete.')
        return
      }

      try {
        const response = await fetch(
          `https://ug-backend-wkk1.onrender.com/api/products?name=${encodeURIComponent(
            nameToDelete
          )}&category=${encodeURIComponent(categoryToDelete)}`,
          { method: 'DELETE' }
        )

        if (!response.ok) throw new Error('Failed to delete product')

        const result = await response.json()
        alert(`✅ Product "${result.deleted.name}" has been deleted.`)
        await fetchInventoryProducts()
        inventoryForm.reset()
        imagePreview.style.display = 'none'
      } catch (error) {
        console.error('Error deleting product:', error)
        alert('❌ Product not found or error occurred.')
      }
    })

  // === UPDATE PRODUCT ===
 document
  .getElementById('update-product-btn')
  .addEventListener('click', async e => {
    e.preventDefault()
    const name = document.getElementById('product-name').value.trim()
    const category = document.getElementById('Product-category').value
    const quantity = document.getElementById('product-qty').value.trim()
    const price = document.getElementById('product-price').value.trim()

    if (!name || !category) {
      alert('Please enter Product Name and select Category to update.')
      return
    }

    const imageFile = imageInput.files[0]

    if (!quantity && !price && !imageFile) {
      alert('Please provide either a new Quantity, Price, Upload or one of those/all.')
      return
    }

    const formData = new FormData()
    formData.append('name', name)
    formData.append('category', category)
    if (quantity) formData.append('quantity', quantity)
    if (price) formData.append('price', price)
    if (imageFile) formData.append('image', imageFile)

    try {
      const response = await fetch(
        `https://ug-backend-wkk1.onrender.com/api/products/update`,
        {
          method: 'PUT',
          body: formData
        }
      )

      const result = await response.json()
      if (!response.ok)
        throw new Error(result.message || 'Failed to update product.')

      alert('Product updated successfully.')
      await fetchInventoryProducts()
      inventoryForm.reset()
      imagePreview.style.display = 'none'
    } catch (err) {
      console.error('Update error:', err)
      alert('❌ Failed to update product. Please try again.')
    }
  })

  // === INVENTORY FILTER & SORT ===
  let inventoryProducts = []

  async function fetchInventoryProducts () {
    try {
      const response = await fetch('https://ug-backend-wkk1.onrender.com/api/products')
      inventoryProducts = await response.json()
      applyInventoryFilters()
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  function renderInventoryTable (data) {
    inventoryTableBody.innerHTML = ''
    data.forEach(product => {
      const row = document.createElement('tr')
      row.innerHTML = `
        <td>${product._id}</td>
        <td>${product.name}</td>
        <td>${product.category}</td>
        <td>${product.quantity}</td>
        <td>$${product.price}</td>
      `
      inventoryTableBody.appendChild(row)
    })
  }

  function applyInventoryFilters () {
    const query = document.getElementById('searchInventory').value.toLowerCase()
    const sortField = document.getElementById('sortInventoryField').value
    const sortOrder = document.querySelector(
      'input[name="sortInventoryOrder"]:checked'
    ).value

    let filtered = inventoryProducts.filter(p =>
      p.name.toLowerCase().includes(query)
    )

    filtered.sort((a, b) => {
      const valA = sortField === 'qty' ? a.quantity : a.price
      const valB = sortField === 'qty' ? b.quantity : b.price
      return sortOrder === 'asc' ? valA - valB : valB - valA
    })

    renderInventoryTable(filtered)

    document
      .getElementById('download-inventory')
      .addEventListener('click', () => {
        const rows = document.querySelectorAll('#inventory-table-body tr')
        const data = Array.from(rows).map(row => {
          const cells = row.querySelectorAll('td')
          return {
            ProductID: cells[0].textContent,
            ProductName: cells[1].textContent,
            Category: cells[2].textContent,
            Quantity: cells[3].textContent,
            Price: cells[4].textContent
          }
        })

        downloadCSV(data, 'inventory.csv', [
          'ProductID',
          'ProductName',
          'Category',
          'Quantity',
          'Price'
        ])
      })
  }

  // === EVENT LISTENERS ===
  document
    .getElementById('searchInventory')
    .addEventListener('input', applyInventoryFilters)
  document
    .getElementById('sortInventoryField')
    .addEventListener('change', applyInventoryFilters)
  document
    .querySelectorAll('input[name="sortInventoryOrder"]')
    .forEach(radio => radio.addEventListener('change', applyInventoryFilters))

  function downloadCSV (data, filename, headers) {
    const csvRows = []

    // Add headers
    csvRows.push(headers.join(','))

    // Add data
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header] ?? ''
        return `"${String(val).replace(/"/g, '""')}"` // Escape quotes
      })
      csvRows.push(values.join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  // === INITIAL LOAD ===
  fetchInventoryProducts()
})
