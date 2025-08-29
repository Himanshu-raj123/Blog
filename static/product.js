fetch('/dashboard/products')
   .then((res) => {
      return res.json();
   })
   .then((res) => {
      res.products.forEach((elm) => {
         let div = document.createElement('div');

         // Contents of Div ...
         let h1 = document.createElement('h1');
         h1.innerText = elm.title

         const video = document.createElement('video');
         video.setAttribute('src', elm.video);
         video.setAttribute('controls', true);

         let para = document.createElement('p');
         para.innerText = elm.description;
         para.style.display = 'none'

         let div1 = document.createElement('div');
         div1.setAttribute('id', "buttons")

         let button1 = document.createElement('button');
         button1.innerText = 'Show Description'

         button1.addEventListener('click', () => {
            if (para.style.display === 'none') {
               para.style.display = 'block'
               button1.innerText = 'Hide Description'
            } else {
               para.style.display = 'none'
               button1.innerText = 'Show Description'
            }
         });

         let comments = document.createElement('div')
         comments.setAttribute('id', 'comments');
         comments.style.display = 'none';
         comments.style.overflowY = "scroll";
         comments.innerHTML = `<div id="commentHead"><h2>Comments Section</h2> </br> <form method="post" action='/addComments/${elm.id}'><input type="text" name="addcomment" placeholder="SendComment">
         <input type="submit">
         </form>
         </div>`

         let button2 = document.createElement('button');
         button2.innerHTML = '<i class="fa-regular fa-comment-dots" style="color: #ff0d0dff;"></i>'

         button2.addEventListener('click', () => {
            if (comments.style.display === 'none') {
               comments.style.display = 'block'
            } else {
               comments.style.display = 'none'
            }
         });

         fetch(`/comments/${elm.id}`)
            .then(res => res.json())
            .then(res => {
               if (res.length > 0) {
                  res.forEach(data => {
                     let commentPara = document.createElement('p');
                     commentPara.innerText = data
                     comments.appendChild(commentPara);
                  })
               }else{
                  throw new Error("No Comments Yet")
               }
            })
            .catch(err => {
               let commentPara = document.createElement('p');
               commentPara.innerText = "No Comments Yet";
               commentPara.style.backgroundColor = "grey"
               comments.appendChild(commentPara);
            }
            )

         let button3 = document.createElement('button');
         button3.innerHTML = `<i class="fa-regular fa-heart" style="color: #cd1d1d;"></i> ${elm.likes.length}`
         button3.addEventListener('click', () => {
            whatToDo("likes", elm.id);
         })

         let button4 = document.createElement('button');
         button4.innerHTML = `<i class="fa-regular fa-thumbs-down" style="color: #ea0b0bff;"></i> ${elm.dislikes.length}`
         button4.addEventListener('click', () => {
            whatToDo("dislikes", elm.id);
         })

         let button5 = document.createElement('button');
         button5.innerHTML = `<i class="fa-solid fa-trash" style="color: #f1043f;"></i>`
         button5.addEventListener('click', () => {
            whatToDo("delete", elm.id);
         })

         if(res.role === "Admin"){
            div1.append(button2, button3, button4, button5)
         }else if(res.role === "user" && elm.user === res.email){
            div1.append(button2, button3, button4, button5)
         }else{
            div1.append(button2, button3, button4)
         }

         div.append(h1, video, para, button1, div1,comments)

         document.getElementById('blog').appendChild(div);

      })
   })

function whatToDo(activity, id) {
   fetch(`/changes/${activity}/${id}`)
      .then(res => res.text())
      .then(res => {
         console.log(res);
         window.location.reload();
      })
      .catch(err => {
         console.log("Error in activity : ", err);
      })
}

