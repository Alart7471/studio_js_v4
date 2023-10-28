import Vue from 'https://cdn.jsdelivr.net/npm/vue@2.6.11/dist/vue.esm.browser.js'
const audio = new Audio();
audio.volume = 0.01//вернуть на 0 25
var currentDate

new Vue({
    el:"#app",
	data() {
		return {
			folders: [],
      data: [],
			files: [],
      filesInQueue: [],
      foldersdb: {},
      foldersearch:[],
      currentFolder: '/',
      lastFolder:'',
			showSubfolders: false,
      sortedByName: false,
      sortedByDate: false,
      sortedByDuration: false,
      isPlaying: false,
      music_obj:{},
      name:'',
      duration:'0',
      totalDuration:'',
      currentTime:'0:00',
      currentTImeSec:0,
      progress:0,
      volumeProgress:25,
      volumeC:0.5,
      isVolume:true,
      isSearching:false,
      searchInptValue:'',
      maxFolders:0,
      loading:false,
      uploadfilebtn:false,
      showModal:false,
      modalWindowName:'',
      settingsObject:[],
      settingsNewTrackName:'',
      date: '',//playlists:
      datetime:'',
      choiceDate:'',
      currentPlaylistWindow:'', //must be main
      currentPlaylistDate:'',
      isPlanActive:false,
      isPlanChoice:false,
      loaded_blocks:[],
      showContent:[],
      showContentToday:[],
      showContentPlan:[],
      selectContentPlan:[],
      showContentGenerationPlaylist:[],
      modalWindowPlanName:'',
      planDate:'',
      planDateCounter:0,
      planFolder1:'',
      planFolder1db:[],
      isPlanning: false,
      planPlaylistExist:0,//0 - не определено,1 - плейлиста нет, 2 - плейлист есть, 3 - генерация,
      // planFolder1db_selected:
      loaded_blocks_today:[],
      isPlanExist:false,
      globalLoading:true,
      loaded_blocks_playlist:[]
		}
	},
	methods: {
		loadFiles(folder, toFolder) {
      if(toFolder == 'foldersdb'){
        this.foldersdb = {}
        this.showSubfolders = true;
        this.currentFolder = folder
        for(let i = 0; i < this.data[folder].length; i++){
          if(!this.foldersdb[folder]){
             this.foldersdb[folder] = [];
          }
          // .id, .name, .created (datatime), .duration (text) 
          this.foldersdb[folder].push({id: this.data[folder][i].id, name: this.data[folder][i].name, created: this.data[folder][i].created, duration: this.data[folder][i].duration, auditions: this.data[folder][i].auditions});
         }
      }
      else if(toFolder == 'planFolder1'){
        this.planFolder1db = []
        for(let i = 0; i < this.data[folder].length; i++){
          if(!this.foldersdb[folder]){
             this.foldersdb[folder] = [];
          }
          // .id, .name, .created (datatime), .duration (text) 
          this.planFolder1db.push({id: this.data[folder][i].id, name: this.data[folder][i].name, created: this.data[folder][i].created, duration: this.data[folder][i].duration, auditions: this.data[folder][i].auditions, selected: false});
          
        }
      }
		},
		goUpOneLevel() {
      this.lastFolder = this.currentFolder
			this.showSubfolders = false;
			this.files = [];
			//this.foldersdb = {};
      this.currentFolder = '/'
		},
    sort(n, obj){
      switch (n) {
          case 0: //Date
              this.showSubfolders=false
              this.sortBy(0, obj)
              this.showSubfolders=true
              break
          case 1: //Name
              this.showSubfolders=false
              this.sortBy(1, obj)
              this.showSubfolders=true
              break
          case 2: //Dur
              this.showSubfolders=false
              this.sortBy(2, obj)
              this.showSubfolders=true
              break
      }
    },
    sortBy(n, obj){
      var sortA
      var sortB
      var self = this
      obj.sort(function(a,b){
          switch (n) {
              case 0: //Date
                  sortA = a.created.toUpperCase()
                  sortB = b.created.toUpperCase()
                  break
              case 1: //Name
                  sortA = a.name.toUpperCase()
                  sortB = b.name.toUpperCase()
                  break
              case 2: //Dur
                  sortA = a.duration.toUpperCase()
                  sortB = b.duration.toUpperCase()
                  break
          }
          var comparison = 0
          if (sortA > sortB) {
              comparison = 1
          } else if (sortA < sortB) {
              comparison = -1
          }
          switch(n){
              case 0: //Date
                  return self.sortedByDate ? comparison * -1 : comparison
              case 1: //Name
                  return self.sortedByName ? comparison * -1 : comparison
              case 2: //Dur
                  return self.sortedByDuration ? comparison * -1 : comparison
          }
      })
      switch(n){
          case 0: //Date
              this.sortedByDate = !this.sortedByDate
              break
          case 1: //Name
              this.sortedByName = !this.sortedByName
              break
          case 2: //Dur
              this.sortedByDuration = !this.sortedByDuration
              break
      }
    },   
    async loadFilesDb(){
      this.loading = true
      await axios
      .get('/loadFiles')
      .then(response => {
        this.folders=[]
        this.data = response.data
        //console.log(this.data)
        Object.keys(this.data).forEach(foldername => {
          //console.log(fileName)
          this.folders.push(foldername)
        })
        this.loading = false
      })
      .catch(error =>{
          console.log(error)
      })
    },
    setNameAndObj(i){
      if(this.name == ''){
          this.name=i.name
          this.music_obj=i
          this.playAudioC(i)
      }
      else{
          this.playAudioC(i)
      }
    },
    async playAudioC(i) {
      if(this.name == ''){
          this.playAudio()
          return
      }
      if(audio.src == ''){
          this.tryToLoadMusic()
          return
      }
      //console.log(this.name + " == " + i.name)
      if(this.name == i.name){
          this.playAudio()
          return
      }
      this.name=i.name
      this.totalDuration=i.duration
      this.music_obj=i
      
      this.tryToLoadMusic()
    },
    async tryToLoadMusic(){
      try {
          const response = await axios
          .get('/audio', {
            params: {
              musicName: this.name
            },
            responseType: 'blob'
          });
          const blob = new Blob([response.data], { type: 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          // console.log(this.foldersdb)
          if(this.showSubfolders == false && this.isSearching == false){
            this.addFilesToQueue(this.foldersdb[this.lastFolder])
          }
          else if(!this.isSearching ){
            this.addFilesToQueue(this.foldersdb[this.currentFolder])
          }
          else{
            this.addFilesToQueue(this.foldersearch)
          }
          audio.src = url;
          var playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise
            .then(_ => {
              // Automatic playback started!
              // Show playing UI.
              this.isPlaying=true
            })
            .catch(error => {
              // Auto-play was prevented
              // Show paused UI.
            })}
          
          
          audio.addEventListener('loadedmetadata', () => {
            this.duration = this.formatTime(audio.duration);
            this.totalDuration = this.formatTime(audio.duration);
          });
  
          audio.addEventListener('timeupdate', () => {
            this.progress = (audio.currentTime / audio.duration) * 1000;
            this.currentTime = this.formatTime(audio.currentTime);
            this.currentTImeSec = audio.currentTime
          });
        } catch (error) {
          console.error(error);
        }
    },
    playAudio(){
      if(this.name == ''){
          alert("Трек не выбран\nТреки находятся в папках в левой части экрана")
          return
      }
      if(this.isPlaying){
          this.isPlaying = !this.isPlaying
          this.currentTImeSec = audio.currentTime
          audio.pause()
      }
      else{
          this.isPlaying = !this.isPlaying
          audio.play()
          audio.currentTime = this.currentTImeSec
      }
      return
    },

    formatTime(seconds) {
      var minutes = Math.floor(seconds / 60);
      var seconds = Math.floor(seconds % 60);
      return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    },

    updateTime() {
      //console.log("UPD TIME!")
      audio.currentTime = (this.progress / 1000) * audio.duration;
      this.currentTime = this.formatTime(audio.currentTime);
      this.currentTImeSec = audio.currentTime
    },
    updateVolume() {
      //console.log("UPD VOL!")
      audio.volume = (this.volumeProgress / 100);
      //console.log(audio.volume)
      this.isVolume = true
      audio.muted = false
    },
    volume(){
      if(this.isVolume){
          audio.muted = true
          this.isVolume=!this.isVolume
      }
      else{
          audio.muted = false
          this.isVolume=!this.isVolume
      }
      //console.log("vol: " + audio.volume)
      //console.log(audio.muted)
    },
    addObject(object){
      //console.log(object)
    },
    searchTrack(value){
      this.foldersearch = []
      value.toUpperCase()
      self = this
      if(value == "@all"){
          Object.keys(this.data).forEach(folderName => {
              this.data[folderName].forEach(function(file) {
                  self.foldersearch.push({id: file.id, name: file.name, created: file.created, duration: file.duration});                        
              });
          })
          return
      }
      Object.keys(this.data).forEach(folderName => {
          this.data[folderName].forEach(function(file) {
              if(file.name.toUpperCase().indexOf(value.toUpperCase()) != -1){
                  self.foldersearch.push({id: file.id, name: file.name, created: file.created, duration: file.duration});                        
              }
          });
      })
    },
    async uploadFile(event) {
      var quit = false
      
      const file = event.target.files[0];
      Object.keys(this.data).forEach(folderName => {
        this.data[folderName].forEach(function(myfile) {
          if(file.name == myfile.name){
            alert("Файл с таким названием уже существует!")
            quit = true
            this.uploadfilebtn = false
            return
          }
        })
      })
      if(quit){
        return
      }
      
      var folders = []
      Object.keys(this.data).forEach(folderName => {
        folders.push(folderName)
      })
      const folder = prompt("Выберите папку из существующих или введите название новой:\n" + folders.join('\n'))
      if(!folder){
        alert("Вы не указали название папки!")
        this.uploadfilebtn = false
        return
      }
      this.loading = true
      var fileExt = file.name.split('.').pop();
      if (fileExt === 'mp3' || fileExt === 'wav' || fileExt === 'ogg') {
        const formData = new FormData();
        formData.append('file', file);
        var audioContext = new AudioContext();
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = async () => {
          const arrayBuffer = reader.result;
          var audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          var duration = audioBuffer.duration;
          //console.log(this.formatDuration(duration))
          formData.append('duration', this.formatDuration(duration))
          formData.append('folder', folder)
          try {
            await axios
            .post('/upload', formData)
            .then(async res => {
              //console.log(res)
              setTimeout(await this.loadFilesDb, 1500)
              this.uploadfilebtn = false
              this.showSubfolders = false
            })
            .catch(err => {console.log(err)})
            
          } catch (error) {
            console.error(error);
          }
        };
      }
      else{
        alert('Недопустимый формат файла!\nДопускаются .mp3 .wav .ogg')
      }
    },
    formatDuration(durationInSeconds) {
      const minutes = Math.floor(durationInSeconds / 60).toString().padStart(2, '0')
      const seconds = (durationInSeconds % 60).toString().padStart(2, '0')
      if(parseInt(seconds) > 0 && parseInt(seconds) < 10){
        return parseInt(minutes) + ':0' + parseInt(seconds)
      }
      return parseInt(minutes) + ':' + parseInt(seconds)
    },
    addFilesToQueue(folder){
      this.filesInQueue = []
      var finded = false;
      for(let i = 0; i < 2; i++){
        folder.forEach(element => {
          //console.log(element)
          if(i == 1 && element.name == this.name){
            finded = false
          }
          if(finded == false){
            if(i == 0 && element.name == this.name){
              finded = !finded
            }
          }
          else{
            this.filesInQueue.push(element)
          }
          
        });
      }
    },
    prevTrack(){
      //console.log('currentTImeSec: ' + this.currentTImeSec)
      //console.log('duration: ' + this.duration)
      if(this.currentTImeSec > 5){
        //console.log("Запустить с начала")
        audio.pause()
        audio.currentTime = 0
        audio.play()
      }
      else{
        //console.log(this.duration)
        //console.log("Переключить назад")
        this.name = this.filesInQueue[this.filesInQueue.length-1].name
        this.music_obj = this.filesInQueue[this.filesInQueue.length-1]
        this.tryToLoadMusic()
      }
    },
    nextTrack(){
      this.name=this.filesInQueue[0].name
      this.music_obj=this.filesInQueue[0]
      this.tryToLoadMusic()
    },
    showModalFunc(data){
      this.settingsObject=[]
      this.settingsNewTrackName=''
      if(data.name == undefined){
        this.showModal = !this.showModal
        return
      }
      this.modalWindowName = 'main'
      console.log("Открыты настройки для " + data.name)
      this.settingsObject = data
      this.showModal = !this.showModal
    },
    tryToRename(){
      //console.log('Попытка переименовать ' + this.setNameAndObj.name + ' в ' + this.settingsNewTrackName)
      if(this.settingsNewTrackName == ''){
        alert('Введите новое название!')
        return
      }
      var a = this.settingsObject.name.split('.')
      if(a.length > 2){
        var b = a[0]
        for(let i = 1; i < a.length-1; i++){
          b += a[i]
        }
        a[0] = b
        a[1] = a[a.length-1]
      }
      //console.log(a)
      if(confirm("Вы точно хотите сменить название\n" + this.settingsObject.name+  "\nна\n" + this.settingsNewTrackName+'.'+a[1] + ' ?')){
        if(prompt("Для смены названия файла на\n" + this.settingsNewTrackName+'.'+a[1] + '\nвведите ПОДТВЕРДИТЬ') == 'ПОДТВЕРДИТЬ'){
          //console.log("RENAMEEE!!!")
          this.modalWindowName = 'loading'
          this.renameDb(this.settingsObject.name,this.settingsNewTrackName+'.'+a[1])
        }
      }
      
    },
    async renameDb(a, b){
      await axios
      .post('/api/rename', {
        currentName: a,
        newName: b
      })
      .then(async response =>{
        //console.log(response.data)
        this.loading = false
        this.modalWindowName='rename'
        setTimeout(await this.loadFilesDb, 1500)
        this.showSubfolders = false
        this.showModal = false
        
      })
      .catch(err => {
        console.log(err)
      })
    },
    tryToDelete(){
      console.log('Попытка удалить ' + this.settingsObject.name)
      if(confirm('Вы действительно хотите удалить файл\n' + this.settingsObject.name + '\nс сервера?')){
        if(prompt('Для подтверждения удаления файла\n' + this.settingsObject.name + '\nвведите УДАЛИТЬ')=='УДАЛИТЬ'){
          //console.log('TryToDelete!')
          this.deleteDb(this.settingsObject.name)
        }
      }
    },
    async deleteDb(name){
      await axios
      .get('/api/delete', {
        params:{
          musicName: name
        }
      })
      .then(res => {
        if(res.data == true){
          //console.log('Удалил')
          setTimeout(this.loadFilesDb, 1500)
          this.showModal = false
          this.showSubfolders = false
        }
        else{
          console.log("Произошла ошибка на стороне сервера")
        }
      })
    },
    async loadDate(){
      await axios
      .get('http://worldtimeapi.org/api/timezone/Europe/Moscow')
      .then(res => {
        //console.log(res.data
        var date = new Date(res.data.datetime);
        this.datetime = date
        var formattedDate = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        this.date = formattedDate
        this.planDate = formattedDate
        this.currentPlaylistDate = 'playlist-'+formattedDate
        this.loadPlaylistsDb(this.currentPlaylistDate, 0, 'today')
        //console.log(formattedDate); // playlist-2023-06-08 ггггммдд
        setInterval(() => {
          currentDate = new Date();
          this.datetime = currentDate;
        }, 1000);
      
      })
      
    },
    startPlanning(window){
      if(this.isPlanActive){
       this.isPlanActive=!this.isPlanActive
       return
      }
      this.isPlanActive=true
      this.isPlanChoice=false
    },
    findPlaylist(){
      this.isPlanChoice=true
      this.isPlanActive=false
    },
    async loadPlaylistsDb(playlistname, reqType, when){
      await axios
      .get('api/playlists/get', {
        params:{
          playlistname: playlistname
        }
      })
      .then(res =>{
        if(reqType == 1){
          console.log(res.data)
          if(res.data == 0){
            this.isPlanExist = false
            return
          }
          else{
            this.isPlanExist = true
            return
          }
        }
        else{
          if(when != 'today'){
            if(res.data == 0){
              this.planPlaylistExist=1
              this.modalWindowPlanName=''
              this.globalLoading = false

            }
            else{
              this.planPlaylistExist=2
              this.modalWindowPlanName=''
              this.globalLoading = false
              // this.fillLoaded_blocks_playlist(res.data)
            }
          }
          else{
            if(res.data == 0){
              this.planPlaylistExist=1
              this.modalWindowPlanName=''
              this.globalLoading = false

            }
            else{
              this.modalWindowPlanName=''
              this.loaded_blocks_today=res.data
              this.planPlaylistExist=2
              for(let i = 0; i < this.loaded_blocks_today.length; i++){//По блокам
                this.showContentToday.push({show: false})
                if(this.loaded_blocks_today[i].block_tracks == ''){
                  this.loaded_blocks_today[i].totalduration = '0:00'
                }
                else{
                  var b = this.loaded_blocks_today[i].block_tracks.split(',').map(Number)
                  this.loaded_blocks_today[i].block_tracks = []
                  for(let c = 0; c < b.length; c++){
                    if(!(b[c] == 0)){
                      this.loaded_blocks_today[i].block_tracks.push(b[c])
                    }
                  }

                  for(let j = 0; j < this.loaded_blocks_today[i].block_tracks.length; j++){//По трекам в блоке
                    if(this.loaded_blocks_today[i].block_tracks)
                    self = this
                    Object.keys(this.data).forEach(foldername =>{
                      self.data[foldername].forEach(function(file) {
                        if(file.id == self.loaded_blocks_today[i].block_tracks[j]){
                          self.loaded_blocks_today[i].block_tracks[j] = ({name: file.name, duration: file.duration})
                        }
                      })
                    })
                  }
                  if(this.loaded_blocks_today[i].block_tracks.length != undefined){
                    this.loaded_blocks_today[i].totalduration=this.getDuration(this.loaded_blocks_today[i].block_tracks)
                  }
                }
              }
              this.globalLoading=false
            }
          }
        }
      })
    },
    async loadToday(){
      await axios
      .get('/api/playlists/get')
      .then(res => {
        this.loaded_blocks_today=res.data
        
        for(let i = 0; i < this.loaded_blocks_today.length; i++){
        }
      })
      this.planPlaylistExist=2
      this.modalWindowPlanName=''
    },
    async loadPlaylistBlocksDb(){
      await axios
      .get('/api/playlists/blocks')
      .then(res => {
        //this.loaded_blocks=[]//Занулять не нужно, блоклист пока один
        this.loaded_blocks=res.data
        this.showContentPlan=[]
        for(let i = 0; i < this.loaded_blocks.length; i++){
         this.showContent.push({id: this.loaded_blocks[i].id, show: false})
         this.showContentPlan.push({id: this.loaded_blocks[i].id, show: false})
         this.selectContentPlan.push({id: this.loaded_blocks[i].id, selected: false})
        }
      })
      
    },
    showContentOne(event, i){
      if (!event.ctrlKey) {
        // Если Ctrl не был зажат
        this.showContent[i-1].show = !this.showContent[i-1].show
      }
      else {
        // Если Ctrl был зажат
        return;
      }
    },
    showContentTwo(event, i){
      if (!event.ctrlKey) {
        // Если Ctrl не был зажат
        this.showContentToday[i-1].show = !this.showContentToday[i-1].show
        
      }
      else {
        // Если Ctrl был зажат
        return;
      }
    },
    showContentPlanOne(event, i){
      if (!event.ctrlKey) {
        // Если Ctrl не был зажат
        this.showContentPlan[i-1].show = !this.showContentPlan[i-1].show
      }
      else {
        // Если Ctrl был зажат
        return;
      }
    },
    selectContentPlanOne(event, i){
      if (!event.ctrlKey) {
        // Если Ctrl не был зажат
        for(let j = 0; j < this.selectContentPlan.length; j++){
          this.selectContentPlan[j].selected = false
        }
        this.selectContentPlan[i-1].selected = !this.selectContentPlan[i-1].selected
      }
      else {
        // Если Ctrl был зажат
        return;
      }
    },
    showContentSwitcher(bool){
      for(let i = 0; i < this.showContent.length; i++){
        //console.log(i)
        this.showContent[i].show = !bool
      }
    },
    showContentSwitcherTwo(bool){
      for(let i = 0; i < this.showContentToday.length; i++){
        //console.log(i)
        this.showContentToday[i].show = !bool
      }
    },
    showContentPlanSwitcher(bool){
      for(let i = 0; i < this.showContentPlan.length; i++){
        //console.log(i)
        this.showContentPlan[i].show = !bool
      }
    },
    selectContentPlanSwitcher(i){
      this.selectContentPlan[i-1].selected = !this.selectContentPlan[i-1].selected
    },
    tryToCreatePlaylist(date){
      this.modalWindowPlanName='loading'
      console.log('tryToCreatePlaylist')
      this.loadPlaylistsDb('playlist-'+date, 0, '')
      this.isPlanning = true
    },
    selectPlanFolder1(folder){
      if(this.modalWindowPlanName=='loading'){
        return
      }
      if(folder == this.planFolder1){
       this.planFolder1=''
       return
      }
      this.planFolder1 = folder
      this.loadFiles(this.planFolder1,'planFolder1')
    },
    generatePlaylist(type){
      if(type == 'new'){
        this.planPlaylistExist = 3
        this.generation_blocks = this.loaded_blocks
      }
      else{
        this.planPlaylistExist = 3
        this.generation_blocks = this.loaded_blocks_playlist
      }
      
    },
    plan_file_up(a, b){
      for(let i = 0; i < this.generation_blocks[a].track.length;i++){
        //console.log(i)
        if(i == b){
          var local1 = this.generation_blocks[a].track[b]
          var local2 = this.generation_blocks[a].track[b-1]
          this.generation_blocks[a].track[b] = local2
          this.generation_blocks[a].track[b-1] = local1
        }
      }
    },
    plan_file_down(a, b){
      for(let i = 0; i < this.generation_blocks[a].track.length;i++){
        //console.log(i)
        if(i == b){
          var local1 = this.generation_blocks[a].track[b]
          var local2 = this.generation_blocks[a].track[b+1]
          this.generation_blocks[a].track[b] = local2
          this.generation_blocks[a].track[b+1] = local1
        }
      }
    },
    plan_file_del(a, b){
      //console.log(this.generation_blocks[a])
      this.generation_blocks[a].track.splice(b, 1)
      if(this.generation_blocks[a].track.length == 0){
        delete this.generation_blocks[a].track
      }
      //console.log(this.generation_blocks[a])
    },
    selectPlanFile(event, i){
      if(!event.ctrlKey){
        //CTRL не был зажат
        for(let j = 0; j < this.planFolder1db.length; j++){
          this.planFolder1db[j].selected=false
        }
        this.planFolder1db[i-1].selected = !this.planFolder1db[i-1].selected
          
        
      }
      else{
        //CTRL был зажат
        return
      }
    },
    selectPlanFileSwitcher(i){
      this.planFolder1db[i-1].selected = !this.planFolder1db[i-1].selected
    },
    modal_btn_add_start(){//в начало
      var add = []
      var blocksid = []
      var blocks = []
      for(let i = 0; i < this.planFolder1db.length; i++){
        if(this.planFolder1db[i].selected){
          add.push(this.planFolder1db[i])
          //console.log('add push')
        }
      }
      for(let i = 0; i < this.generation_blocks.length; i++){
        if(this.selectContentPlan[i].selected){
          //console.log(i)
          blocksid.push(this.selectContentPlan[i].id)
        }
      }
      for(let i = 0; i < blocksid.length; i++){
        for(let j = 0; j < add.length; j++){
          for(let k = 0; k < this.generation_blocks.length; k++){
            if(this.generation_blocks[k].id == blocksid[i]){
              if(this.generation_blocks[k].track){
                this.generation_blocks[k].track.push({name: add[j].name, duration: add[j].duration, id: add[j].id})
              }
              else{
                this.generation_blocks[k].track = []
                this.generation_blocks[k].track.push({name: add[j].name, duration: add[j].duration, id: add[j].id})
              }
            }
          }
        }
      }
      for(let i = 0; i < this.generation_blocks.length; i++){
        if(this.generation_blocks[i].track){
          this.generation_blocks[i].duration = this.getDuration(this.generation_blocks[i].track)
        }
      
      }
    },
    getDuration(tracks) {
      let totalSeconds = 0;
      tracks.forEach((track) => {
        const [minutes, seconds] = track.duration.split(':');
        totalSeconds += parseInt(minutes) * 60 + parseInt(seconds);
      });
      if(totalSeconds == 0){return '0:00'}
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    async uploadPlaylist(){
      this.globalLoading = true
      this.modalWindowPlanName='loading'
      this.isPlanExist = false
      await this.loadPlaylistsDb(this.planDate, 1, 'open')
      if(this.isPlanExist){
      }
      else{
        this.tryToUpload()
      }
    },
    async tryToUpload(){
      for(let i = 0; i < this.generation_blocks.length; i++){
        var ids = []
        if(this.generation_blocks[i].track){
          for(let j = 0; j < this.generation_blocks[i].track.length;j++){
            ids.push(this.generation_blocks[i].track[j].id)
          }
        }
        if(ids.length != 0){
          this.generation_blocks[i].ids = ({ids:  ids})
        }
        else{
          this.generation_blocks[i].ids = ''
        }
        
      }
      try {
      await axios
      .post('/api/playlists/post', {
        blocks: this.generation_blocks,
        name: 'playlist-'+this.planDate,
      })
      .then(async res => {
        //console.log(res)
        this.modalWindowPlanName='plan'
        this.globalLoading=false
        this.planFolder1=''
        this.planPlaylistExist=2
        if(this.planDate == this.date){
          await this.loadToday()
        }
      })
      .catch(err => {console.log(err)})
      } catch (error){
        console.log(error)
      }
    },
    setAllLoaded(){
      this.globalLoading=false
    }
	},
  beforeMount(){
    console.log('beforeMount 123')
    this.loadFilesDb()
    this.loadPlaylistBlocksDb()
    this.loadDate()

    console.log(this.globalLoading)
    setTimeout(this.setAllLoaded, 1500)
  },
  mounted(){
    console.log('mounted 456')
  },
  filters: {
    formatDate: function (value) {
    return moment(value).format('DD.MM.YYYY HH:mm:ss');
  }
  },
  watch: {
    searchInptValue(newValue, oldValue) {
      if(newValue == ''){
        this.isSearching = false
        return
      }
      this.isSearching = true
      this.searchTrack(newValue)
      
    },
    currentTime(newValue, oldValue){
      //console.log(newValue)
      if(newValue == this.totalDuration){
        this.nextTrack()
      }
    },
    planDate(n, o){
      if(n == this.date && this.planDateCounter == 0){
        this.planDateCounter++
        return
      }
      this.planDate = n
      this.globalLoading = true
      this.tryToCreatePlaylist(n)
    },
  },
});


