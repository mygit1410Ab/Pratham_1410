import { useDispatch } from 'react-redux';
import { useState, useEffect } from 'react';
import { getPolicyAction } from '../../redux/action';

const usePolicy = (type) => {
    const dispatch = useDispatch();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dispatch(
            getPolicyAction({ type }, (res) => {
                setData(res);
                setLoading(false);
            })
        );
    }, [type]);

    return { data, loading };
};

export default usePolicy;
