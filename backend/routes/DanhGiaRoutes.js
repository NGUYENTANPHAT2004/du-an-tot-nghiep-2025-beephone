const express = require('express')
const router = express.Router()


router.post('/danhgia',async(req,res)=>{
    try{
        const {tenkhach,content,rating} = req.body
        const vietnamTime = momemttimezone().toDate()
        const danhgia = new DanhGia.danhgia({
            tenkhach,
            content,
            rating,
            date: vietnamTime
        })
        await danhgia.save()
        res.json(danhgia)
    }catch(error){
        console.error(error)
        res.status(500).json({message:`Đã xảy ra lỗi: ${error}`})
    }
})

router.post('/danhgiaadmin',async(req,res)=>{
    try{
        const { tenkhach,content,rating } = req.body
        const vietnamTime = momemttimezone().toDate()
        const danhgia = new DanhGia.danhgia({
            tenkhach,
            content,
            rating,
            date:vietnamTime,
            isRead:true
        })
        await danhgia.save()
        res.json(danhgia)
    }catch(error){
        console.error(error)
        res.status(500).json({message:`Đã xảy ra lỗi: ${error}`})
    }
})

router.get('/getdanhgia',async(req,res)=>{
    try{
        const danhgia = await DanhGia.danhgia.find({isRead:true}).lean()

        res.json(danhgia)
    }catch (error){
        console.error(error)
        res.status(500).json({message:`Đã xảy ra lỗi: ${error}`})
    }
})

router.get('/getdanhgiaadmin', async (req,res)=>{
    try {
        const danhgia = await DanhGia.danhgia.find().lean()
        res.json(danhgia)
    } catch (error) {
        console.error(error)
        res.status(500).json({message:`Đã xảy ra lỗi: ${error}`})
    }
} )

router.post('/duyetdanhgia', async (req,res)=>{
    try {
        const { ids } = req.body

        if(!ids || !Array.isArray(ids) ){
            return res.status(400).json({message:'Danh sách ID  không hợp lệ'})

        }

        await DanhGia.danhgia.updateMany(
            {_id:{$id:ids}},
            {$set:{isRead:true}}
        )
        res.json({
            message:'Duyệt đánh giá thành công'
        })
    } catch (error) {
        console.error(error)
        res.status(500).json({message:`Đã xảy ra lỗi:${error}`})
    }
})

router.post('/xoadanhgia',async (req,res)=>{
    try {
        const { ids } = req.body

        if(!ids || !Array.isArray(ids)){
            return res.status(400).json({message})
        }
        await DanhGia.danhgia.deleteMany({_id:{$in:ids}})

        res.json({
            message:'Xoá đánh giá thành công'
        })

    } catch (error) {
        console.error(error)
        res.status(500).json({message:`Đã xảy ra lỗi: ${error}`})       
    }
})

module.exports = router  